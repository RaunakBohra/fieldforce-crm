import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Save, ArrowLeft, Wand2, Scan, Camera as CameraIcon, X, Upload, Bell } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Camera } from '../components/Camera';
import { compressImage, getImageSizeKB } from '../utils/imageCompression';

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category: '',
    price: '',
    stock: '',
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) {
      fetchProduct(id);
    }
  }, [id]);

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

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await api.getProduct(productId);
      if (response.success && response.data) {
        const product = response.data;
        setFormData({
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || '',
          description: product.description || '',
          category: product.category,
          price: product.price.toString(),
          stock: product.stock.toString(),
        });
        // Set existing image if available
        if (product.imageUrl) {
          setImagePreview(product.imageUrl);
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSku = async () => {
    setGeneratingSku(true);
    try {
      const response = await api.generateSku();
      if (response.success && response.data) {
        setFormData({ ...formData, sku: response.data.sku });
      }
    } catch (err) {
      console.error('Failed to generate SKU:', err);
      alert('Failed to generate SKU');
    } finally {
      setGeneratingSku(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData({ ...formData, barcode });
    setShowBarcodeScanner(false);
  };

  const handleImageCapture = async (photoDataUrl: string) => {
    try {
      const compressed = await compressImage(photoDataUrl);
      setProductImage(compressed);
      setImagePreview(compressed);
      setShowCamera(false);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Failed to process image');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result as string;
        const compressed = await compressImage(dataUrl);
        setProductImage(compressed);
        setImagePreview(compressed);
      } catch (err) {
        console.error('Failed to process image:', err);
        alert('Failed to process image');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      const response = isEditMode && id
        ? await api.updateProduct(id, productData)
        : await api.createProduct(productData);

      if (response.success && response.data) {
        const productId = response.data.id || id;

        // Upload image if present and changed
        if (productImage && productId) {
          setUploadingImage(true);
          try {
            await api.uploadProductImage(productId, productImage);
          } catch (err) {
            console.error('Failed to upload image:', err);
            // Continue anyway - product is created/updated
          } finally {
            setUploadingImage(false);
          }
        }

        if (isEditMode) {
          // For edit mode, go back to products list
          navigate('/products');
        } else {
          // For create mode, show notification modal
          setCreatedProductId(response.data.id);
          setShowNotifyModal(true);
        }
      } else {
        setError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!createdProductId) return;

    setSendingNotification(true);
    try {
      const response = await api.notifyProductLaunch(createdProductId);
      if (response.success) {
        alert(`Product launch notification sent to ${response.data?.successCount || 0} user(s)`);
        navigate('/products');
      } else {
        alert(response.error || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      alert('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSkipNotification = () => {
    setShowNotifyModal(false);
    navigate('/products');
  };

  return (
    <PageContainer>
      <ContentSection maxWidth="4xl">
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-neutral-600">
                {isEditMode ? 'Update product information' : 'Create a new product in your catalog'}
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 bg-white rounded-md hover:bg-neutral-50 border border-neutral-300"
            >
              <ArrowLeft size={20} />
              Back to Products
            </button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 error-message">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  SKU *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field flex-1"
                    placeholder="e.g., PROD-001"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    disabled={generatingSku}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Wand2 size={18} />
                    {generatingSku ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Barcode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field flex-1"
                    placeholder="Scan or enter barcode"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 flex items-center gap-2"
                  >
                    <Scan size={18} />
                    Scan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="select-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW">+ Add New Category</option>
                </select>
                {formData.category === 'NEW' && (
                  <input
                    type="text"
                    placeholder="Enter new category name"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field mt-2"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="textarea-field"
                  placeholder="Product description..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Image
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-48 h-48 object-cover rounded-md border border-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-danger-600 text-white p-1 rounded-full hover:bg-danger-500"
                    >
                      <X size={16} />
                    </button>
                    {productImage && (
                      <p className="text-xs text-neutral-600 mt-1">
                        Size: {getImageSizeKB(productImage)} KB
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 flex items-center gap-2"
                    >
                      <CameraIcon size={18} />
                      Take Photo
                    </button>
                    <label className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-500 flex items-center gap-2 cursor-pointer">
                      <Upload size={18} />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="btn-primary flex-1"
              >
                <Save size={20} />
                {uploadingImage ? 'Uploading...' : loading ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      </ContentSection>

      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showCamera && (
        <Camera
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <Bell className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Product Created!</h3>
                <p className="text-sm text-neutral-600">Would you like to notify users?</p>
              </div>
            </div>

            <p className="text-neutral-700 mb-6">
              Send new product alert to all active users via SMS?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSendNotification}
                disabled={sendingNotification}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50"
              >
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
              <button
                onClick={handleSkipNotification}
                disabled={sendingNotification}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
