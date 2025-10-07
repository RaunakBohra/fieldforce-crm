import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Save, ArrowLeft, Wand2, Scan, Camera as CameraIcon, X, Upload, Bell } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Camera } from '../components/Camera';
import { compressImage, getImageSizeKB } from '../utils/imageCompression';
import { showToast } from '../components/ui';
import { validators } from '../utils/validation';

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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

  // Validation
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        return validators.required(value, 'Product name') || validators.minLength(value, 2, 'Product name');
      case 'sku':
        return validators.required(value, 'SKU');
      case 'category':
        return validators.required(value, 'Category');
      case 'price':
        return validators.required(value, 'Price') || validators.positiveNumber(value, 'Price');
      case 'stock':
        return validators.number(value, 'Stock') || validators.min(value, 0, 'Stock');
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.name = validateField('name', formData.name);
    errors.sku = validateField('sku', formData.sku);
    errors.category = validateField('category', formData.category);
    errors.price = validateField('price', formData.price);
    if (formData.stock) errors.stock = validateField('stock', formData.stock);

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof typeof formData]);
    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

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
      showToast.error('Failed to generate SKU');
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
      showToast.error('Failed to process image');
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
        showToast.error('Failed to process image');
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
    setError('');

    // Validate form
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      setTouched({ name: true, sku: true, category: true, price: true, stock: true });
      return;
    }

    setLoading(true);

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
        showToast.success(`Product launch notification sent to ${response.data?.successCount || 0} user(s)`);
        navigate('/products');
      } else {
        showToast.error(response.error || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      showToast.error('Failed to send notification');
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
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`input-field ${touched.name && fieldErrors.name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
                {touched.name && fieldErrors.name && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  SKU *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    onBlur={() => handleBlur('sku')}
                    className={`input-field flex-1 ${touched.sku && fieldErrors.sku ? 'border-danger-500 focus:ring-danger-500' : ''}`}
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
                {touched.sku && fieldErrors.sku && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.sku}</p>
                )}
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
                  onChange={(e) => handleChange('category', e.target.value)}
                  onBlur={() => handleBlur('category')}
                  className={`select-field ${touched.category && fieldErrors.category ? 'border-danger-500 focus:ring-danger-500' : ''}`}
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
                    onChange={(e) => handleChange('category', e.target.value)}
                    onBlur={() => handleBlur('category')}
                    className="input-field mt-2"
                    required
                  />
                )}
                {touched.category && fieldErrors.category && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.category}</p>
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
                  onChange={(e) => handleChange('price', e.target.value)}
                  onBlur={() => handleBlur('price')}
                  className={`input-field ${touched.price && fieldErrors.price ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
                {touched.price && fieldErrors.price && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                  onBlur={() => handleBlur('stock')}
                  className={`input-field ${touched.stock && fieldErrors.stock ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
                {touched.stock && fieldErrors.stock && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.stock}</p>
                )}
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
                      aria-label="Remove image"
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
