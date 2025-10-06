import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { CreateVisitData, Contact } from '../services/api';
import { MapPin, Navigation as NavigationIcon, Loader2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';

export function VisitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const [formData, setFormData] = useState<CreateVisitData>({
    contactId: '',
    visitDate: new Date().toISOString().slice(0, 16),
    visitType: 'FIELD_VISIT',
    status: 'COMPLETED',
    latitude: undefined,
    longitude: undefined,
    locationName: '',
    purpose: '',
    notes: '',
    outcome: 'SUCCESSFUL',
    duration: undefined,
    nextVisitDate: '',
    products: [],
    followUpRequired: false,
    followUpNotes: '',
  });

  const [productsInput, setProductsInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  useEffect(() => {
    if (isEditing) {
      fetchVisit();
    }
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

  const fetchVisit = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.getVisit(id);
      if (response.success && response.data) {
        const visit = response.data;
        setFormData({
          contactId: visit.contactId,
          visitDate: new Date(visit.visitDate).toISOString().slice(0, 16),
          visitType: visit.visitType,
          status: visit.status,
          latitude: visit.latitude,
          longitude: visit.longitude,
          locationName: visit.locationName || '',
          purpose: visit.purpose || '',
          notes: visit.notes || '',
          outcome: visit.outcome,
          duration: visit.duration,
          nextVisitDate: visit.nextVisitDate ? new Date(visit.nextVisitDate).toISOString().slice(0, 16) : '',
          products: visit.products || [],
          followUpRequired: visit.followUpRequired,
          followUpNotes: visit.followUpNotes || '',
        });
        setProductsInput(visit.products?.join(', ') || '');
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
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFetchingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get location: ' + error.message);
        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse products from comma-separated input
      const productsArray = productsInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const visitData: CreateVisitData = {
        ...formData,
        products: productsArray,
        visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : undefined,
        nextVisitDate: formData.nextVisitDate ? new Date(formData.nextVisitDate).toISOString() : undefined,
      };

      const response = isEditing
        ? await api.updateVisit(id!, visitData)
        : await api.createVisit(visitData);

      if (response.success) {
        navigate('/visits');
      } else {
        setError(response.error || 'Failed to save visit');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to save visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-6">
            {isEditing ? 'Edit Visit' : 'New Visit'}
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full px-3 py-2 mb-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                required
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.designation && `- ${contact.designation}`} {contact.city && `(${contact.city})`}
                  </option>
                ))}
              </select>
              {contacts.length === 0 && contactSearch && (
                <p className="mt-1 text-sm text-neutral-500">No contacts found matching "{contactSearch}"</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visit Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Visit Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Visit Type
                </label>
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="FIELD_VISIT">Field Visit</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="PLANNED">Planned</option>
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="POSTPONED">Postponed</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              {/* Outcome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Outcome
                </label>
                <select
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            </div>

            {/* GPS Location */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  GPS Location
                </label>
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={fetchingLocation}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {fetchingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <NavigationIcon className="w-4 h-4" />
                      Capture Location
                    </>
                  )}
                </button>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </span>
                </div>
              )}

              <div className="mt-3">
                <input
                  type="text"
                  value={formData.locationName || ''}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="Location name (e.g., Hospital Name, Clinic Address)"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Brief purpose of visit"
                maxLength={500}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder="Detailed notes about the visit..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Separate multiple products with commas
              </p>
            </div>

            {/* Follow-up */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm font-medium text-neutral-700">
                  Follow-up Required
                </label>
              </div>

              {formData.followUpRequired && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Next Visit Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.nextVisitDate || ''}
                      onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Follow-up Notes
                    </label>
                    <textarea
                      value={formData.followUpNotes || ''}
                      onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                      rows={3}
                      maxLength={1000}
                      placeholder="Follow-up requirements..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Visit' : 'Create Visit'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/visits')}
                className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
