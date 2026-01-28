'use client';

import { Product } from '@/types/product';
import { useState } from 'react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onDuplicate: (product: Product) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  formatRupiah: (amount: number) => string;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onDuplicate,
  pagination,
  onPageChange,
  formatRupiah,
}: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Product>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Use API pagination if available
  const displayPagination = pagination || {
    page: currentPage,
    limit: itemsPerPage,
    total: products.length,
    pages: Math.ceil(products.length / itemsPerPage),
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop View - Table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{product.name}</span>
                        {product.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {product.description?.substring(0, 60)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                    {product.category}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm font-semibold text-white">{formatRupiah(product.price)}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className={`w-full h-2 rounded-full ${product.stock < 10 ? 'bg-red-500/20' : 'bg-green-500/20'} overflow-hidden`}>
                      <div
                        className={`h-full ${product.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (product.stock / 100) * 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ml-3 ${product.stock < 10 ? 'text-red-400' : 'text-green-400'}`}>
                      {product.stock}
                      {product.stock < 10 && (
                        <span className="text-xs ml-1 text-red-400">(Low)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => onToggleStatus(product.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      product.active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                  >
                    {product.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onToggleFeatured(product.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        product.featured
                          ? 'text-pink-400 hover:text-pink-300 hover:bg-pink-500/20'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/20'
                      }`}
                      title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDuplicate(product)}
                      className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {displayPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/30">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((displayPagination.page - 1) * displayPagination.limit) + 1} to {Math.min(displayPagination.page * displayPagination.limit, displayPagination.total)} of {displayPagination.total} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(displayPagination.page - 1)}
                  disabled={displayPagination.page === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, displayPagination.pages) }, (_, i) => {
                    let pageNum;
                    if (displayPagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (displayPagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (displayPagination.page >= displayPagination.pages - 2) {
                      pageNum = displayPagination.pages - 4 + i;
                    } else {
                      pageNum = displayPagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                          displayPagination.page === pageNum
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(displayPagination.page + 1)}
                  disabled={displayPagination.page === displayPagination.pages}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}