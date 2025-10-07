import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Product, ProductQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Package, Plus } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { Pagination } from '../components/ui';
import { ProductCard } from '../components/ProductCard';

export function ProductsList() {
  const navigate = useNavigate();
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

  const handleEditProduct = (product: Product) => {
    // Navigate to edit page - could be implemented later
    // For now, just log
    console.log('Edit product:', product.id);
  };

  const handleProductClick = (product: Product) => {
    // Navigate to product detail page - could be implemented later
    // For now, just edit
    handleEditProduct(product);
  };

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

        {/* Products Grid */}
        {loading ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-neutral-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-16 px-4 min-h-[400px] bg-white rounded-lg border border-neutral-200">
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
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEditProduct(product)}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}

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
