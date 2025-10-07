import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Product, ProductQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Search, Package, Plus, Edit2, Barcode, ImageIcon } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { Pagination, StatusBadge } from '../components/ui';
import { formatCurrency } from '../utils/formatters';

export function ProductsList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: ProductQueryParams = {
        page: currentPage,
        limit,
        isActive: true,
      };

      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.getProducts(params);
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getProductCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/${productId}/edit`);
  };

  // Mobile Card View Component
  const ProductMobileCard = ({ product }: { product: Product }) => (
    <div
      className="p-4 border-b border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
      onClick={() => handleEditProduct(product.id)}
    >
      <div className="flex gap-3 mb-3">
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
          {product.thumbnailUrl || product.imageUrl ? (
            <img
              src={product.thumbnailUrl || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-neutral-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate">{product.name}</h3>
          <p className="text-sm text-neutral-600 mt-0.5">SKU: {product.sku}</p>
          {product.barcode && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
              <Barcode className="w-3.5 h-3.5" />
              <span>{product.barcode}</span>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-neutral-900">{formatCurrency(product.price)}</p>
          <span className={`inline-flex items-center justify-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            product.stock > 10
              ? 'bg-success-100 text-success-800'
              : product.stock > 0
              ? 'bg-warn-100 text-warn-800'
              : 'bg-danger-100 text-danger-800'
          }`}>
            {product.stock} in stock
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge
          label={product.category}
          variant="primary"
          formatLabel={false}
        />
        <StatusBadge
          label={product.isActive ? 'Active' : 'Inactive'}
          variant={product.isActive ? 'success' : 'neutral'}
          formatLabel={false}
        />
      </div>
    </div>
  );

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1">
              <h1 className="page-title">Product Catalog</h1>
              <p className="page-subtitle">
                Browse and select products for orders
              </p>
            </div>
            <button
              onClick={() => navigate('/products/new')}
              className="btn-primary"
            >
              <Plus className="icon-btn" />
              <span className="font-medium">Add Product</span>
            </button>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Package className="icon-status" />
            <h2 className="section-heading">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="relative">
              <Search className="icon-search" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-search"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select-field"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setCurrentPage(1);
              }}
              className="btn-ghost"
            >
              Reset Filters
            </button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 error-message">
            {error}
          </div>
        )}

        {/* Products Table */}
        <Card className="mt-6 border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <Package className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Products Yet</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Build your product catalog by adding products. This will help you create orders more efficiently.
              </p>
              <button onClick={() => navigate('/products/new')} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="bg-white">
              {products.map((product) => (
                <ProductMobileCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="table-header text-left">Image</th>
                    <th className="table-header text-left">Product Name</th>
                    <th className="table-header text-left">SKU</th>
                    <th className="table-header text-left">Barcode</th>
                    <th className="table-header text-left">Category</th>
                    <th className="table-header text-right">Price</th>
                    <th className="table-header text-center">Stock</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="table-cell">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                          {product.thumbnailUrl || product.imageUrl ? (
                            <img
                              src={product.thumbnailUrl || product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-neutral-400" />
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">{product.name}</span>
                          {product.description && (
                            <span className="text-sm text-neutral-500 truncate max-w-xs">
                              {product.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-sm text-neutral-700">{product.sku}</span>
                      </td>
                      <td className="table-cell">
                        {product.barcode ? (
                          <div className="flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-neutral-400" />
                            <span className="font-mono text-sm text-neutral-700">{product.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <StatusBadge
                          label={product.category}
                          variant="primary"
                          formatLabel={false}
                        />
                      </td>
                      <td className="table-cell text-right">
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-full text-sm font-medium ${
                          product.stock > 10
                            ? 'bg-success-100 text-success-800'
                            : product.stock > 0
                            ? 'bg-warn-100 text-warn-800'
                            : 'bg-danger-100 text-danger-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge
                          label={product.isActive ? 'Active' : 'Inactive'}
                          variant={product.isActive ? 'success' : 'neutral'}
                          formatLabel={false}
                        />
                      </td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </ContentSection>
    </PageContainer>
  );
}
