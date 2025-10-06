import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact } from '../services/api';
import { MapPin, Navigation as NavigationIcon, Loader2, Camera as CameraIcon, X, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { Camera } from '../components/Camera';
import { compressImage, getImageSizeKB } from '../utils/imageCompression';

export function VisitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCheckingOut = !!id; // If ID exists, we're checking out

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  // Check-in state
  const [selectedContactId, setSelectedContactId] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('');

  // Check-out state
  const [visitData, setVisitData] = useState<any>(null);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('SUCCESSFUL');
  const [productsInput, setProductsInput] = useState('');
  const [samples, setSamples] = useState<Array<{ productId: string; productName: string; quantity: number }>>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  // Photo state
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isCheckingOut) {
      fetchVisit();
    }
    // GPS is now manual - no auto-capture
  }, [id]);

  const fetchContacts = async () => {
    try {
      const params: any = { limit: 50, isActive: true };
      if (contactSearch) params.search = contactSearch;
      const response = await api.getContacts(params);
      if (response.success && response.data) {
        setContacts(response.data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts({ limit: 100, isActive: true });
      if (response.success && response.data) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchVisit = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.getVisit(id);
      if (response.success && response.data) {
        setVisitData(response.data);
      } else {
        setError(response.error || 'Visit not found');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch visit');
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFetchingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setFetchingLocation(false);
        if (error.code === 1) {
          alert('Location permission denied. Please enable location access in your browser settings.');
        } else {
          alert('Failed to get location: ' + error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    try {
      // Compress to 200KB
      const compressed = await compressImage(photoDataUrl, 200);
      const sizeKB = getImageSizeKB(compressed);

      console.log(`Photo compressed to ${sizeKB.toFixed(1)}KB`);

      if (photos.length < 2) {
        setPhotos([...photos, compressed]);
      }
    } catch (err) {
      console.error('Photo compression error:', err);
      alert('Failed to compress photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addSample = () => {
    setSamples([...samples, { productId: '', productName: '', quantity: 1 }]);
  };

  const removeSample = (index: number) => {
    setSamples(samples.filter((_, i) => i !== index));
  };

  const updateSample = (index: number, field: 'productId' | 'productName' | 'quantity', value: string | number) => {
    const updated = [...samples];
    updated[index] = { ...updated[index], [field]: value };
    setSamples(updated);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedContactId) {
        setError('Please select a contact');
        return;
      }

      const response = await api.checkInVisit({
        contactId: selectedContactId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        locationName,
      });

      if (response.success && response.data) {
        // Navigate to check-out form
        navigate(`/visits/${response.data.visit.id}`);
      } else {
        setError(response.error || 'Failed to check in');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload photos first
      const photoKeys: string[] = [];
      for (const photo of photos) {
        const uploadResponse = await api.uploadVisitPhoto(photo, id);
        if (uploadResponse.success && uploadResponse.data) {
          photoKeys.push(uploadResponse.data.objectKey);
        }
      }

      // Parse products
      const productsArray = productsInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Convert samples
      const samplesGiven = samples.reduce((acc, sample) => {
        if (sample.productId && sample.quantity > 0) {
          acc[sample.productId] = sample.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      const response = await api.checkOutVisit(id!, {
        purpose,
        notes,
        outcome,
        products: productsArray,
        samplesGiven: Object.keys(samplesGiven).length > 0 ? samplesGiven : undefined,
        followUpRequired,
        followUpNotes: followUpRequired ? followUpNotes : undefined,
        nextVisitDate: followUpRequired && nextVisitDate ? new Date(nextVisitDate).toISOString() : undefined,
        photos: photoKeys,
      });

      if (response.success) {
        navigate('/visits');
      } else {
        setError(response.error || 'Failed to check out');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  // Calculate visit duration
  const getVisitDuration = () => {
    if (!visitData?.checkInTime) return null;
    const start = new Date(visitData.checkInTime);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - start.getTime()) / 1000 / 60);
    return diffMinutes;
  };

  if (loading && isCheckingOut) {
    return (
      <PageContainer>
        <ContentSection maxWidth="4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection maxWidth="4xl">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              {isCheckingOut ? 'Check Out Visit' : 'Check In Visit'}
            </h1>
            {isCheckingOut && visitData?.checkInTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{getVisitDuration()} minutes</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 error-message">
              {error}
            </div>
          )}

          {!isCheckingOut ? (
            // CHECK-IN FORM
            <form onSubmit={handleCheckIn} className="space-y-6">
              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Select Contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="input-field mb-2"
                />
                <select
                  required
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="select-field"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.designation && `- ${contact.designation}`} {contact.city && `(${contact.city})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* GPS Location */}
              <div className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    GPS Location {location && <span className="text-success-600">✓</span>}
                  </label>
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={fetchingLocation}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50"
                  >
                    {fetchingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <NavigationIcon className="w-4 h-4" />
                        Capture GPS
                      </>
                    )}
                  </button>
                </div>

                {location && (
                  <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                  </div>
                )}

                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Location name (e.g., Hospital Name, Clinic)"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedContactId}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Check In
                  </>
                )}
              </button>
            </form>
          ) : (
            // CHECK-OUT FORM
            <form onSubmit={handleCheckOut} className="space-y-6">
              {/* Visit Info */}
              {visitData && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-900 mb-2">Visit Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Contact:</span> {visitData.contact?.name}</p>
                    <p><span className="font-medium">Checked In:</span> {new Date(visitData.checkInTime).toLocaleTimeString()}</p>
                    {visitData.locationName && (
                      <p><span className="font-medium">Location:</span> {visitData.locationName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Purpose of Visit
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Brief purpose of visit"
                  className="input-field"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Visit Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Detailed notes about the visit..."
                  className="textarea-field"
                />
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Outcome
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="select-field"
                >
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="UNSUCCESSFUL">Unsuccessful</option>
                  <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
                  <option value="ORDER_PLACED">Order Placed</option>
                  <option value="SAMPLE_GIVEN">Sample Given</option>
                  <option value="INFORMATION_ONLY">Information Only</option>
                </select>
              </div>

              {/* Products Discussed */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Products Discussed
                </label>
                <input
                  type="text"
                  value={productsInput}
                  onChange={(e) => setProductsInput(e.target.value)}
                  placeholder="Product 1, Product 2, Product 3"
                  className="input-field"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Separate multiple products with commas
                </p>
              </div>

              {/* Sample Distribution */}
              <div className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Samples Distributed
                  </label>
                  <button
                    type="button"
                    onClick={addSample}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sample
                  </button>
                </div>

                {samples.length > 0 ? (
                  <div className="space-y-3">
                    {samples.map((sample, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <select
                            value={sample.productId}
                            onChange={(e) => {
                              const product = products.find(p => p.id === e.target.value);
                              updateSample(index, 'productId', e.target.value);
                              updateSample(index, 'productName', product?.name || '');
                            }}
                            className="select-field"
                          >
                            <option value="">Select Product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} {product.sku && `(${product.sku})`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={sample.quantity}
                            onChange={(e) => updateSample(index, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                            className="input-field"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSample(index)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No samples added. Click "Add Sample" to track product samples given during visit.
                  </p>
                )}
              </div>

              {/* Photos */}
              <div className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Photos ({photos.length}/2)
                  </label>
                  {photos.length < 2 && (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
                    >
                      <CameraIcon className="w-4 h-4" />
                      Take Photo
                    </button>
                  )}
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Visit photo ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-danger-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-neutral-500 mt-1 text-center">
                          {getImageSizeKB(photo).toFixed(1)}KB
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No photos added. Click "Take Photo" to capture visit evidence.
                  </p>
                )}
              </div>

              {/* Follow-up */}
              <div className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="followUpRequired" className="ml-2 block text-sm font-medium text-neutral-700">
                    Follow-up Required
                  </label>
                </div>

                {followUpRequired && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Next Visit Date
                      </label>
                      <input
                        type="datetime-local"
                        value={nextVisitDate}
                        onChange={(e) => setNextVisitDate(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Follow-up Notes
                      </label>
                      <textarea
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        rows={3}
                        placeholder="Follow-up requirements..."
                        className="textarea-field"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Check Out
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/visits')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>
      </ContentSection>

      {/* Camera Modal */}
      {showCamera && (
        <Camera
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </PageContainer>
  );
}
