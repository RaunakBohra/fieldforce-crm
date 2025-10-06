import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Territory } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { MapPin, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TerritoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [territories, setTerritories] = useState<Territory[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'CITY' as 'COUNTRY' | 'STATE' | 'CITY' | 'DISTRICT' | 'ZONE',
    country: '',
    state: '',
    city: '',
    pincode: '',
    parentId: '',
    isActive: true,
  });

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fetch territories for parent selection
  useEffect(() => {
    fetchTerritories();
  }, []);

  // Fetch territory data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchTerritory();
    }
  }, [isEditMode, id]);

  const fetchTerritories = async () => {
    try {
      const response = await api.getTerritories({ limit: 100, isActive: 'true' });
      if (response.success && response.data) {
        setTerritories(response.data.territories);
      }
    } catch (error) {
      console.error('Failed to fetch territories:', error);
    }
  };

  const fetchTerritory = async () => {
    try {
      setLoading(true);
      const response = await api.getTerritory(id!);

      if (response.success && response.data) {
        const territory = response.data.territory;
        setFormData({
          name: territory.name,
          code: territory.code,
          description: territory.description || '',
          type: territory.type,
          country: territory.country,
          state: territory.state || '',
          city: territory.city || '',
          pincode: territory.pincode || '',
          parentId: territory.parentId || '',
          isActive: territory.isActive,
        });
      } else {
        setError(response.error || 'Failed to fetch territory');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch territory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.code || !formData.type || !formData.country) {
      setError('Name, code, type, and country are required');
      return;
    }

    // Code format validation
    if (!/^[A-Z0-9-_]+$/.test(formData.code)) {
      setError('Code must contain only uppercase letters, numbers, hyphens, and underscores');
      return;
    }

    try {
      setSubmitting(true);

      const territoryData: any = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        type: formData.type,
        country: formData.country,
        state: formData.state || undefined,
        city: formData.city || undefined,
        pincode: formData.pincode || undefined,
        parentId: formData.parentId || undefined,
        isActive: formData.isActive,
      };

      let response;
      if (isEditMode) {
        response = await api.updateTerritory(id!, territoryData);
      } else {
        response = await api.createTerritory(territoryData);
      }

      if (response.success) {
        navigate('/territories');
      } else {
        setError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} territory`);
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} territory`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (currentUser && currentUser.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <PageContainer>
        <ContentSection>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {isEditMode ? 'Edit Territory' : 'Create New Territory'}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {isEditMode ? 'Update territory information' : 'Add a new territory to the system'}
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <div className="mt-6 max-w-2xl">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Territory Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Mumbai Central"
                />
              </div>

              {/* Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-neutral-700 mb-1">
                  Territory Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="input-field font-mono"
                  placeholder="MH-MUM-CENT"
                  pattern="[A-Z0-9-_]+"
                  title="Uppercase letters, numbers, hyphens, and underscores only"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Use uppercase letters, numbers, hyphens, and underscores (e.g., MH-MUM, NP-KTM)
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="textarea-field"
                  placeholder="Optional description of the territory"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">
                  Territory Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="select-field"
                >
                  <option value="COUNTRY">Country</option>
                  <option value="STATE">State/Province</option>
                  <option value="CITY">City</option>
                  <option value="DISTRICT">District</option>
                  <option value="ZONE">Zone</option>
                </select>
              </div>

              {/* Parent Territory */}
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Territory
                </label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="">None (Top Level)</option>
                  {territories
                    .filter(t => t.id !== id) // Don't allow self as parent
                    .map(territory => (
                      <option key={territory.id} value={territory.id}>
                        {territory.name} ({territory.code}) - {territory.type}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-neutral-500">
                  Optional: Select a parent territory to create hierarchy
                </p>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="India"
                />
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Maharashtra"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Mumbai"
                />
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-neutral-700 mb-1">
                  Pincode/ZIP
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="400001"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-neutral-700">
                  Active
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : isEditMode ? 'Update Territory' : 'Create Territory'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/territories')}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
