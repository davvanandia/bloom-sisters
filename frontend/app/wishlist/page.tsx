'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  inStock: boolean;
  tags: string[];
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: 1,
      name: 'Premium Orchid Bouquet',
      price: 49.99,
      originalPrice: 59.99,
      image: '/images/orchid.jpg',
      category: 'Orchids',
      rating: 4.8,
      inStock: true,
      tags: ['Bestseller', 'Premium']
    },
    {
      id: 2,
      name: 'Elegant White Lily',
      price: 42.99,
      image: '/images/lily.jpg',
      category: 'Lilies',
      rating: 4.9,
      inStock: true,
      tags: ['Elegant', 'Premium']
    },
    {
      id: 3,
      name: 'Passionate Red Roses',
      price: 34.99,
      image: '/images/rose.jpg',
      category: 'Roses',
      rating: 4.7,
      inStock: false,
      tags: ['Romantic', 'Classic']
    },
    {
      id: 4,
      name: 'Spring Bliss Bouquet',
      price: 54.99,
      image: '/images/spring.jpg',
      category: 'Bouquets',
      rating: 4.8,
      inStock: true,
      tags: ['Spring', 'Colorful']
    },
    {
      id: 5,
      name: 'Lavender Bliss',
      price: 46.99,
      image: '/images/lavender.jpg',
      category: 'Herbs',
      rating: 4.8,
      inStock: true,
      tags: ['Aromatic', 'Calming']
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const handleRemoveItem = (id: number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
  };

  const handleMoveToCart = (id: number) => {
    const item = wishlistItems.find(item => item.id === id);
    if (item) {
      alert(`Added ${item.name} to cart!`);
      // In real app, dispatch to cart context
      handleRemoveItem(id);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === wishlistItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlistItems.map(item => item.id));
    }
  };

  const handleMoveSelectedToCart = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to move to cart');
      return;
    }
    
    const selectedNames = wishlistItems
      .filter(item => selectedItems.includes(item.id))
      .map(item => item.name);
    
    alert(`Added ${selectedNames.join(', ')} to cart!`);
    
    // Remove selected items from wishlist
    setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to remove');
      return;
    }
    
    if (confirm(`Remove ${selectedItems.length} item(s) from wishlist?`)) {
      setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Wishlist is Empty</h1>
            <p className="text-gray-600 mb-8">
              Save your favorite flowers here to purchase them later or compare options.
            </p>
            <div className="space-y-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Flowers
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Back to Home
              </Link>
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
          <ol className="flex flex-wrap items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-pink-600 font-medium">Wishlist</li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved for later
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button
                onClick={handleSelectAll}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                {selectedItems.length === wishlistItems.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={handleMoveSelectedToCart}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium"
                  >
                    Add Selected to Cart
                  </button>
                  <button
                    onClick={handleRemoveSelected}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Remove Selected
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Wishlist Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="flex">
                  {/* Selection Checkbox */}
                  <div className="p-6 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                    />
                  </div>

                  {/* Product Image */}
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-4xl">💐</div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link href={`/product/${item.id}`}>
                              <h3 className="font-bold text-gray-800 hover:text-pink-600 transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-pink-600">${item.price.toFixed(2)}</div>
                            {item.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">${item.originalPrice.toFixed(2)}</div>
                            )}
                          </div>
                        </div>

                        {/* Rating and Stock */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center text-amber-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            <span className="ml-1 text-sm font-medium">{item.rating}</span>
                          </div>
                          <div className={`text-sm ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-4 mt-4 border-t">
                        <button
                          onClick={() => handleMoveToCart(item.id)}
                          disabled={!item.inStock}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            item.inStock
                              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <div className="text-2xl font-bold text-pink-600">{wishlistItems.length}</div>
                <div className="text-sm text-gray-600">Items Saved</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <div className="text-2xl font-bold text-pink-600">
                  ${wishlistItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {wishlistItems.filter(item => item.originalPrice).length}
                </div>
                <div className="text-sm text-gray-600">Items on Sale</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Tulip Garden Mix', price: 39.99, category: 'Tulips' },
                { name: 'Peony Dream', price: 59.99, category: 'Peonies' },
                { name: 'Sunflower Sunshine', price: 37.99, category: 'Seasonal' },
                { name: 'Chrysanthemum Garden', price: 44.99, category: 'Seasonal' },
              ].map((product, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                    <div className="text-4xl">💐</div>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-pink-600">${product.price.toFixed(2)}</span>
                    <button className="px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors text-sm font-medium">
                      Add to Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-3 border-2 border-pink-600 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}