import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { CreateContactData } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { Select, showToast } from '../components/ui';
import { DISTRIBUTION_TYPES, MEDICAL_TYPES, VISIT_FREQUENCIES } from '../constants';

export function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [territories, setTerritories] = useState<Array<{ id: string; name: string; code: string; type: string }>>([]);
  const [formData, setFormData] = useState<CreateContactData>({
    contactCategory: 'MEDICAL',
    name: searchParams.get('name') || '',
    contactType: 'DOCTOR',
    visitFrequency: 'MONTHLY',
    isActive: true,
  });

  useEffect(() => {
    fetchTerritories();
    if (isEditMode && id) {
      fetchContact(id);
    }
  }, [id, isEditMode]);

  const fetchTerritories = async () => {
    try {
      const response = await api.getTerritories();
      if (response.success && response.data) {
        setTerritories(response.data.territories);
      }
    } catch (err) {
      console.error('Failed to fetch territories:', err);
    }
  };

  const fetchContact = async (contactId: string) => {
    try {
      setLoading(true);
      const response = await api.getContact(contactId);
      if (response.success && response.data) {
        setFormData(response.data);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch contact');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: 'DISTRIBUTION' | 'MEDICAL') => {
    setFormData({
      ...formData,
      contactCategory: category,
      contactType: category === 'DISTRIBUTION' ? 'WHOLESALER' : 'DOCTOR',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = isEditMode
        ? await api.updateContact(id!, formData)
        : await api.createContact(formData);

      if (response.success) {
        showToast.success(
          isEditMode ? 'Contact updated successfully' : 'Contact created successfully',
          `${formData.name} has been ${isEditMode ? 'updated' : 'added'} to your contacts`
        );
        navigate('/contacts');
      } else {
        const errorMsg = response.error || `Failed to ${isEditMode ? 'update' : 'create'} contact`;
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } catch (err) {
      const error = err as Error;
      const errorMsg = error.message || `Failed to ${isEditMode ? 'update' : 'create'} contact`;
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateContactData, value: CreateContactData[keyof CreateContactData]) => {
    setFormData({ ...formData, [field]: value });
  };

  const getContactTypes = () => {
    return formData.contactCategory === 'DISTRIBUTION' ? DISTRIBUTION_TYPES : MEDICAL_TYPES;
  };

  if (loading && isEditMode) {
    return (
      <PageContainer>
        <ContentSection maxWidth="4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-600">Loading contact...</div>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection maxWidth="4xl">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {isEditMode ? 'Edit Contact' : 'Add New Contact'}
              </h1>
              <p className="text-neutral-600">
                {isEditMode ? 'Update contact information' : 'Create a new contact in your network'}
              </p>
            </div>
            <button
              onClick={() => navigate('/contacts')}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 bg-white rounded-md hover:bg-neutral-50 border border-neutral-300"
            >
              <ArrowLeft size={20} />
              Back to Contacts
            </button>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact Category</h2>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="MEDICAL"
                  checked={formData.contactCategory === 'MEDICAL'}
                  onChange={(e) => handleCategoryChange(e.target.value as 'MEDICAL')}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                />
                <span className="ml-3 text-sm font-medium text-neutral-900">Medical Professional</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="DISTRIBUTION"
                  checked={formData.contactCategory === 'DISTRIBUTION'}
                  onChange={(e) => handleCategoryChange(e.target.value as 'DISTRIBUTION')}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                />
                <span className="ml-3 text-sm font-medium text-neutral-900">Distribution Channel</span>
              </label>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Choose whether this contact is a medical professional (doctor, hospital) or a distribution partner (wholesaler, retailer)
            </p>
          </Card>

          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contact Type *
                </label>
                <select
                  value={formData.contactType}
                  onChange={(e) => handleChange('contactType', e.target.value)}
                  required
                  className="select-field"
                >
                  {getContactTypes().map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Chief Surgeon"
                />
              </div>

              {formData.contactCategory === 'MEDICAL' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={formData.specialty || ''}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    className="input-field"
                    placeholder="e.g., Cardiology, Orthopedics"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Contact Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  placeholder="Optional alternate number"
                  className="input-field"
                />
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Address Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={2}
                  className="textarea-field"
                  placeholder="Street address, building name, floor"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="input-field"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="input-field"
                    placeholder="State name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="6 digits"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Category-Specific Fields */}
          {formData.contactCategory === 'MEDICAL' && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Medical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalName || ''}
                    onChange={(e) => handleChange('hospitalName', e.target.value)}
                    className="input-field"
                    placeholder="Primary hospital affiliation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName || ''}
                    onChange={(e) => handleChange('clinicName', e.target.value)}
                    className="input-field"
                    placeholder="Private clinic or chamber"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    className="input-field"
                    placeholder="Medical registration or license number"
                  />
                </div>
              </div>
            </Card>
          )}

          {formData.contactCategory === 'DISTRIBUTION' && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Distribution Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Territory
                  </label>
                  <Select
                    value={formData.territoryId || ''}
                    onChange={(value) => handleChange('territoryId', value ? String(value) : undefined)}
                    options={territories.map((t) => ({
                      id: t.id,
                      label: t.name,
                      sublabel: `${t.code} • ${t.type}`,
                    }))}
                    placeholder="Search and select territory (optional)..."
                    aria-label="Territory selection"
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    Assign contact to a geographic territory for reporting purposes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit || ''}
                    onChange={(e) => handleChange('creditLimit', e.target.value ? Number(e.target.value) : undefined)}
                    min="0"
                    step="1000"
                    placeholder="e.g., 100000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    placeholder="e.g., Net 30, COD"
                    className="input-field"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Visit Planning */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Visit Planning</h2>

            {/* Visit History - Only shown in edit mode */}
            {isEditMode && (formData as any).lastVisitDate && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-900">Last Visit:</span>
                  <span className="text-sm text-primary-700">
                    {new Date((formData as any).lastVisitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Visit Frequency
                </label>
                <select
                  value={formData.visitFrequency}
                  onChange={(e) => handleChange('visitFrequency', e.target.value)}
                  className="select-field"
                >
                  {VISIT_FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Preferred Day
                </label>
                <input
                  type="text"
                  value={formData.preferredDay || ''}
                  onChange={(e) => handleChange('preferredDay', e.target.value)}
                  placeholder="e.g., Monday"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Preferred Time
                </label>
                <input
                  type="text"
                  value={formData.preferredTime || ''}
                  onChange={(e) => handleChange('preferredTime', e.target.value)}
                  placeholder="e.g., 10:00 AM - 12:00 PM"
                  className="input-field"
                />
              </div>
            </div>

            {/* Next Visit Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Next Scheduled Visit
                </label>
                <input
                  type="datetime-local"
                  value={formData.nextVisitDate ? new Date(formData.nextVisitDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleChange('nextVisitDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="input-field"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Schedule the next visit date and time for this contact
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-500 mt-4">
              Set preferred schedule for field visits to help plan your territory coverage
            </p>
          </Card>

          {/* Additional Information */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="textarea-field"
                  placeholder="Any additional information, preferences, or special instructions"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="isActive" className="ml-3 text-sm font-medium text-neutral-900">
                  Active Contact
                </label>
              </div>
              <p className="text-xs text-neutral-500 ml-7">
                Inactive contacts won't appear in selection lists but remain in the system
              </p>
            </div>
          </Card>

          {/* Submit */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/contacts')}
                className="btn-secondary flex-1 sm:flex-none sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 sm:flex-none sm:w-auto"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
              </button>
            </div>
          </Card>
        </form>
      </ContentSection>
    </PageContainer>
  );
}
