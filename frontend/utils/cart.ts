// frontend/utils/cart.ts

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  stock: number;
  createdAt?: string;
}

const CART_STORAGE_KEY = 'florist_cart';
const CART_EXPIRY_DAYS = 7;

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date untuk display
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Tanggal tidak valid';
    }
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tanggal tidak valid';
  }
};

// Format tanggal pendek
export const formatShortDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Tgl tidak valid';
    }
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Tgl tidak valid';
  }
};

// Format waktu
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

// Format tanggal dan waktu lengkap
export const formatDateTime = (dateString: string): string => {
  const date = formatDate(dateString);
  const time = formatTime(dateString);
  return time ? `${date} ${time}` : date;
};

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) return [];
    
    const parsed = JSON.parse(cartData);
    
    // Handle both old and new format
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      // Check expiry
      if (parsed.expiry && new Date(parsed.expiry) < new Date()) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }
      return parsed.items || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error reading cart:', error);
    return [];
  }
};

export const saveCart = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CART_EXPIRY_DAYS);
    
    const cartData = {
      items,
      expiry: expiry.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

export const addToCart = (product: {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}, quantity: number = 1): CartItem[] => {
  const cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.productId === product.id);
  
  if (existingItemIndex >= 0) {
    // Update existing item
    const newQuantity = cart[existingItemIndex].quantity + quantity;
    cart[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
  } else {
    // Add new item
    cart.push({
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: Math.min(quantity, product.stock),
      image: product.image,
      category: product.category,
      stock: product.stock,
      createdAt: new Date().toISOString(),
    });
  }
  
  saveCart(cart);
  return cart;
};

export const updateCartItemQuantity = (cartItemId: string, quantity: number): CartItem[] => {
  const cart = getCart();
  const itemIndex = cart.findIndex(item => item.id === cartItemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = Math.min(quantity, cart[itemIndex].stock);
    }
    
    saveCart(cart);
  }
  
  return cart;
};

export const removeFromCart = (cartItemId: string): CartItem[] => {
  const cart = getCart();
  const newCart = cart.filter(item => item.id !== cartItemId);
  saveCart(newCart);
  return newCart;
};

export const clearCart = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem('checkout_items');
  window.dispatchEvent(new Event('cartUpdated'));
};

export const getCartTotal = (items?: CartItem[]): number => {
  const cartItems = items || getCart();
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
};

export const getSelectedCartTotal = (selectedIds: string[]): number => {
  const cart = getCart();
  const selectedItems = cart.filter(item => selectedIds.includes(item.id));
  return getCartTotal(selectedItems);
};

export const isProductInCart = (productId: string): boolean => {
  const cart = getCart();
  return cart.some(item => item.productId === productId);
};

export const getCartSummary = () => {
  const cart = getCart();
  const itemCount = getCartItemCount();
  const subtotal = getCartTotal(cart);
  
  return {
    itemCount,
    subtotal,
    formattedSubtotal: formatRupiah(subtotal),
    items: cart,
  };
};

// Calculate discount for voucher
export const calculateVoucherDiscount = (
  subtotal: number,
  voucher: {
    type: 'PERCENTAGE' | 'FIXED';
    discount: number;
    maxDiscount?: number;
  }
): number => {
  if (voucher.type === 'FIXED') {
    return Math.min(voucher.discount, subtotal);
  } else if (voucher.type === 'PERCENTAGE') {
    const discount = (subtotal * voucher.discount) / 100;
    if (voucher.maxDiscount) {
      return Math.min(discount, voucher.maxDiscount);
    }
    return discount;
  }
  return 0;
};

// Validate order items stock
export const validateCartStock = (cartItems: CartItem[]): { valid: boolean; message?: string } => {
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return {
        valid: false,
        message: `Stok "${item.name}" tidak mencukupi. Stok tersedia: ${item.stock}, jumlah dipesan: ${item.quantity}`
      };
    }
  }
  return { valid: true };
};