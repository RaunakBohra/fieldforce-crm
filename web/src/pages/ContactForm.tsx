import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, CreateContactData, Contact } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

const DISTRIBUTION_TYPES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'SUB_SUPER', label: 'Sub Super (Regional)' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'RETAILER', label: 'Retailer' },
];

const MEDICAL_TYPES = [
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
];

const VISIT_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateContactData>({
    contactCategory: 'MEDICAL',
    name: '',
    contactType: 'DOCTOR',
    visitFrequency: 'MONTHLY',
    isActive: true,
  });

  useEffect(() => {
    if (isEditMode && id) {
      fetchContact(id);
    }
  }, [id, isEditMode]);

  const fetchContact = async (contactId: string) => {
    try {
      setLoading(true);
      const response = await api.getContact(contactId);
      if (response.success && response.data) {
        setFormData(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contact');
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
        navigate('/contacts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateContactData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const getContactTypes = () => {
    return formData.contactCategory === 'DISTRIBUTION' ? DISTRIBUTION_TYPES : MEDICAL_TYPES;
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-neutral-600">Loading contact...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Contacts
          </button>
          <h1 className="text-3xl font-bold text-neutral-900">
            {isEditMode ? 'Edit Contact' : 'Add New Contact'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-neutral-200 p-6">
          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Contact Category <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="MEDICAL"
                  checked={formData.contactCategory === 'MEDICAL'}
                  onChange={(e) => handleCategoryChange(e.target.value as 'MEDICAL')}
                  className="w-4 h-4 text-primary-800 focus:ring-primary-800"
                />
                <span className="ml-2 text-neutral-700">Medical</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="DISTRIBUTION"
                  checked={formData.contactCategory === 'DISTRIBUTION'}
                  onChange={(e) => handleCategoryChange(e.target.value as 'DISTRIBUTION')}
                  className="w-4 h-4 text-primary-800 focus:ring-primary-800"
                />
                <span className="ml-2 text-neutral-700">Distribution</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Contact Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contactType}
                  onChange={(e) => handleChange('contactType', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                >
                  {getContactTypes().map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              {formData.contactCategory === 'MEDICAL' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={formData.specialty || ''}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Contact Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Address Information</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode || ''}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="6 digits"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category-Specific Fields */}
          {formData.contactCategory === 'MEDICAL' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Medical Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalName || ''}
                    onChange={(e) => handleChange('hospitalName', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName || ''}
                    onChange={(e) => handleChange('clinicName', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.contactCategory === 'DISTRIBUTION' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Distribution Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Territory
                  </label>
                  <input
                    type="text"
                    value={formData.territory || ''}
                    onChange={(e) => handleChange('territory', e.target.value)}
                    placeholder="e.g., Nepal, Punjab, etc."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit || ''}
                    onChange={(e) => handleChange('creditLimit', e.target.value ? Number(e.target.value) : undefined)}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    placeholder="e.g., Net 30, COD, etc."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Visit Planning */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Visit Planning</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Visit Frequency
                </label>
                <select
                  value={formData.visitFrequency}
                  onChange={(e) => handleChange('visitFrequency', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                >
                  {VISIT_FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Preferred Day
                </label>
                <input
                  type="text"
                  value={formData.preferredDay || ''}
                  onChange={(e) => handleChange('preferredDay', e.target.value)}
                  placeholder="e.g., Monday"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Preferred Time
                </label>
                <input
                  type="text"
                  value={formData.preferredTime || ''}
                  onChange={(e) => handleChange('preferredTime', e.target.value)}
                  placeholder="e.g., 10:00 AM"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Additional Information</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 text-primary-800 focus:ring-primary-800 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                Active Contact
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => navigate('/contacts')}
              className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
