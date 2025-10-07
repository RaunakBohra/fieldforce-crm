import { Package, Edit2 } from 'lucide-react';
import type { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onClick: () => void;
}

export function ProductCard({ product, onEdit, onClick }: ProductCardProps) {
  const stockColor = product.stock > 100
    ? 'text-success-600 bg-success-50'
    : product.stock > 20
    ? 'text-warn-600 bg-warn-50'
    : 'text-danger-600 bg-danger-50';

  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="aspect-square bg-neutral-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-neutral-300" />
          </div>
        )}

        {/* Edit Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-primary-50 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Edit product"
        >
          <Edit2 size={16} />
        </button>

        {/* Stock Badge */}
        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-semibold ${stockColor}`}>
          Stock: {product.stock}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* SKU */}
        <p className="text-xs text-neutral-500 mb-2 font-mono">
          SKU: {product.sku}
        </p>

        {/* Category Badge */}
        <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded mb-3">
          {product.category}
        </span>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
          <span className="text-2xl font-bold text-primary-600">
            ₹{product.price.toLocaleString()}
          </span>
        </div>

        {/* Description (optional, truncated) */}
        {product.description && (
          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}
