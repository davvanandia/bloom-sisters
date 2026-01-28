'use client';

import { Product } from '@/types/product';
import { useState, useEffect } from 'react';

interface ProductFormModalProps {
  product: Product | null;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: string[];
  formatRupiah: (amount: number) => string;
}

export default function ProductFormModal({
  product,
  isEditing,
  onClose,
  onSubmit,
  categories,
  formatRupiah,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    featured: false,
    active: true,
    tags: [] as string[],
    weight: undefined as number | undefined,
    dimensions: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Log untuk debug
  console.log('ProductFormModal loaded with:', {
    categories,
    categoriesLength: categories.length,
    product,
    isEditing
  });

  useEffect(() => {
    console.log('Categories prop changed:', categories);
    
    if (product) {
      // Editing mode - set dari product
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category || (categories.length > 0 ? categories[0] : ''),
        featured: product.featured,
        active: product.active,
        tags: product.tags,
        weight: product.weight,
        dimensions: product.dimensions || '',
      });
      setSelectedCategory(product.category || (categories.length > 0 ? categories[0] : ''));
      setExistingImages(product.images || []);
    } else {
      // Create mode - set default dari categories
      const defaultCategory = categories.length > 0 ? categories[0] : '';
      setFormData(prev => ({
        ...prev,
        category: defaultCategory
      }));
      setSelectedCategory(defaultCategory);
    }
  }, [product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'category') {
      setSelectedCategory(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 :
              value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} tidak didukung. Hanya file gambar (JPEG, PNG, GIF, WebP) yang diperbolehkan.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`File ${file.name} terlalu besar. Maksimal ukuran file adalah 5MB.`);
        return false;
      }
      
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value
    e.target.value = '';
  };

  const handleRemoveNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleUndoRemoveImage = (imageUrl: string) => {
    setImagesToDelete(prev => prev.filter(img => img !== imageUrl));
    setExistingImages(prev => [...prev, imageUrl]);
  };

// Di dalam ProductFormModal.tsx - bagian handleSubmit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validasi field wajib
  if (!formData.name || !formData.price || formData.price <= 0 || 
      formData.stock < 0 || !formData.category || !selectedCategory) {
    alert('Harap isi semua field yang wajib diisi (Nama, Harga, Stok, Kategori).');
    return;
  }

  // Validasi minimal satu gambar untuk produk baru
  if (!isEditing && imageFiles.length === 0) {
    alert('Harap upload minimal satu gambar untuk produk.');
    return;
  }

  // Update category dengan selectedCategory
  const submitData = {
    ...formData,
    category: selectedCategory,
    images: imageFiles,
    // HAPUS konversi kurs - harga sudah dalam Rupiah
    // JANGAN kalikan atau bagi dengan kurs apa pun
    ...(isEditing && {
      existingImages: existingImages,
      deleteImages: imagesToDelete
    }),
  };

  console.log('Submitting data:', submitData);
  onSubmit(submitData);
};

  // Handle Enter untuk menambah tag
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  };

  // Fallback categories jika kosong
  const displayCategories = categories.length > 0 ? categories : [
    'Valentine', 'Graduation', 'Custom'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-gray-400 mt-1">
                {isEditing ? 'Update product details' : 'Create a new product for your store'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Product Info */}
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Contoh: Buket Mawar Valentine Special"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                    placeholder="Deskripsikan produk Anda secara detail..."
                  />
                </div>

                {/* Category - FIXED VERSION */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    value={selectedCategory}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  >
                    <option value="" disabled>
                      {displayCategories.length === 0 ? 'Loading categories...' : 'Pilih kategori'}
                    </option>
                    {displayCategories.map((category, index) => (
                      <option key={`${category}-${index}`} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  
                  {/* Debug info */}
                  <div className="mt-2 text-xs text-gray-500">
                    {displayCategories.length === 0 ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-3 w-3 border-2 border-pink-500 border-t-transparent rounded-full mr-2"></div>
                        Memuat kategori...
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>{displayCategories.length} kategori tersedia</span>
                        <span>Dipilih: {selectedCategory || 'Tidak ada'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tag
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Tambahkan tag dan tekan Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Tambah Tag
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-500/20 text-pink-300 border border-pink-500/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-pink-400 hover:text-pink-300"
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Product Details */}
              <div className="space-y-6">
                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price || ''}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Contoh: 899000"
                    />
                    {formData.price > 0 && (
                      <div className="mt-2 text-sm text-green-400">
                        {formatRupiah(formData.price)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Stok *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock || ''}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Weight & Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Berat (gram)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Opsional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dimensi
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Contoh: 30×30×40 cm"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {isEditing ? 'Tambahkan Gambar Baru' : 'Upload Gambar'} *
                  </label>
                  
                  {/* File Input */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
                        <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-400 mb-1">
                          <span className="text-pink-400 font-medium">Klik untuk upload</span> atau drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WebP maksimal 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Images Preview */}
                  {imageFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Gambar Baru ({imageFiles.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing Images (for editing) */}
                  {isEditing && existingImages.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Gambar Existing ({existingImages.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {existingImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(imageUrl)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deleted Images (for editing) */}
                  {isEditing && imagesToDelete.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Gambar yang akan Dihapus ({imagesToDelete.length})
                        <button
                          type="button"
                          onClick={() => setImagesToDelete([])}
                          className="ml-2 text-xs text-pink-400 hover:text-pink-300"
                        >
                          Batalkan Semua
                        </button>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imagesToDelete.map((imageUrl, index) => (
                          <div key={index} className="relative opacity-50">
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`Deleted ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-red-400 text-sm font-medium">Akan dihapus</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUndoRemoveImage(imageUrl)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center"
                            >
                              ↶
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-all ${formData.featured ? 'bg-pink-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.featured ? 'transform translate-x-4' : ''}`} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-300">Produk Unggulan</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-all ${formData.active ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.active ? 'transform translate-x-4' : ''}`} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-300">Produk Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Image Requirements */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Panduan Gambar</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center">
                  <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload gambar berkualitas tinggi (disarankan: 1200×800 piksel)
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Gambar pertama akan digunakan sebagai gambar utama produk
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Format yang didukung: JPG, PNG, GIF, WebP
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ukuran maksimal file: 5MB per gambar
                </li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors font-medium w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-medium w-full sm:w-auto"
                  disabled={(!isEditing && imageFiles.length === 0) || !selectedCategory}
                >
                  {isEditing ? 'Perbarui Produk' : 'Buat Produk'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}