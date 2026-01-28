'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  maxStock: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Premium Orchid Bouquet',
      price: 49.99,
      quantity: 2,
      image: '/images/orchid.jpg',
      category: 'Orchids',
      maxStock: 10
    },
    {
      id: '2',
      name: 'Pink Rose Arrangement',
      price: 39.99,
      quantity: 1,
      image: '/images/rose.jpg',
      category: 'Roses',
      maxStock: 15
    },
    {
      id: '3',
      name: 'Spring Flower Mix',
      price: 29.99,
      quantity: 3,
      image: '/images/spring.jpg',
      category: 'Seasonal',
      maxStock: 20
    }
  ]);

  const [selectedItems, setSelectedItems] = useState<string[]>(['1', '2', '3']);
  const [isLoading, setIsLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [isVoucherApplied, setIsVoucherApplied] = useState(false);

  // Calculate totals
  const subtotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const shippingFee = selectedItems.length > 0 ? 5.99 : 0;
  const voucherDiscount = isVoucherApplied ? 10 : 0;
  const total = subtotal + shippingFee - voucherDiscount;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.min(newQuantity, item.maxStock) } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const handleApplyVoucher = () => {
    if (voucherCode.trim() && !isVoucherApplied) {
      setIsVoucherApplied(true);
      // In real app, validate voucher with backend
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to checkout');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id));
      localStorage.setItem('checkout_items', JSON.stringify(selectedProducts));
      router.push('/checkout');
      setIsLoading(false);
    }, 500);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">Add some beautiful flowers to brighten your day!</p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Start Shopping
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  title: 'Free Shipping',
                  description: 'Orders over $99',
                  icon: '🚚'
                },
                {
                  title: 'Fresh Flowers',
                  description: 'Guaranteed quality',
                  icon: '🌸'
                },
                {
                  title: 'Easy Returns',
                  description: '30-day policy',
                  icon: '🔄'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-pink-600 font-medium">Shopping Cart</li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:w-2/3">
            {/* Cart Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Shopping Cart ({cartItems.length} items)</h1>
                <button
                  onClick={() => setCartItems([])}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Selection Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                        />
                      </div>

                      {/* Product Image */}
                      <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-3xl">💐</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <Link href={`/product/${item.id}`}>
                              <h3 className="font-semibold text-gray-800 hover:text-pink-600 transition-colors text-lg">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">Category: {item.category}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-2xl font-bold text-pink-600">
                                ${item.price.toFixed(2)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="ml-2 text-sm text-gray-500">
                                  = ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.maxStock}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-10 text-center border-x border-gray-300 focus:outline-none"
                              />
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                                disabled={item.quantity >= item.maxStock}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            {/* Stock info */}
                            <div className="text-sm text-gray-500">
                              Stock: {item.maxStock} available
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
              <h3 className="font-semibold text-gray-800 mb-4">Voucher / Promo Code</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Enter voucher code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isVoucherApplied}
                  />
                </div>
                <button
                  onClick={handleApplyVoucher}
                  disabled={isVoucherApplied || !voucherCode.trim()}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isVoucherApplied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700'
                  }`}
                >
                  {isVoucherApplied ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
              {isVoucherApplied && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">
                    🎉 Voucher applied! You saved ${voucherDiscount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

                {/* Select All */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                    />
                    <span className="ml-3 text-gray-700">Select All Items</span>
                  </div>
                  <span className="text-gray-600">
                    {selectedItems.length}/{cartItems.length} selected
                  </span>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Fee</span>
                    <span className="font-medium">${shippingFee.toFixed(2)}</span>
                  </div>
                  {isVoucherApplied && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voucher Discount</span>
                      <span className="font-medium text-green-600">-${voucherDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 pt-6 border-t">
                  <div>
                    <p className="font-bold text-lg text-gray-800">Total</p>
                    <p className="text-sm text-gray-500">Including tax</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">${total.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">USD</p>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Checkout (${selectedItems.length} items)`
                  )}
                </button>

                {/* Payment Methods */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-3">We accept:</p>
                  <div className="flex gap-2">
                    {['Visa', 'MasterCard', 'PayPal', 'Gopay', 'OVO'].map((method) => (
                      <div
                        key={method}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm"
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure SSL Encryption • 100% Safe Shopping</span>
                  </div>
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="mt-4 text-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}