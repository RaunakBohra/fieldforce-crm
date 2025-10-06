import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Product, ProductQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Package, Edit2, Save, X, Plus } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { Pagination, TableSkeleton } from '../components/ui';

export function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

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

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    try {
      const response = await api.updateProduct(id, editForm);
      if (response.success) {
        fetchProducts();
        setEditingId(null);
        setEditForm({});
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to update product');
    }
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Product Catalog</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Browse and select products for orders
              </p>
            </div>
            <button
              onClick={() => navigate('/products/new')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg hover:bg-primary-700 hover:shadow-md transition-all min-h-[44px] shadow-sm"
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Add Product</span>
            </button>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px] bg-white"
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
              className="px-4 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all font-medium text-sm min-h-[44px]"
            >
              Reset Filters
            </button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Products Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={7}
              headers={['Product Name', 'SKU', 'Description', 'Category', 'Price', 'Stock', 'Actions']}
            />
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              <Package className="mx-auto text-neutral-400 mb-4" size={48} />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Add your first product to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="text-sm font-medium text-neutral-900">{product.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{product.sku}</td>
                  <td className="px-6 py-4">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="text-sm text-neutral-600 max-w-xs truncate">{product.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price || ''}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                        className="w-24 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-neutral-900">₹{product.price}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editForm.stock || ''}
                        onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${product.stock > 100 ? 'text-success-600' : product.stock > 20 ? 'text-warn-600' : 'text-danger-600'}`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(product.id)}
                          className="text-success-600 hover:text-success-900"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-danger-600 hover:text-danger-500"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
        </div>

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
