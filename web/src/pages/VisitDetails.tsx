import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Visit } from '../services/api';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Tag,
  AlertCircle
} from 'lucide-react';

export function VisitDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchVisit();
    }
  }, [id]);

  const fetchVisit = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.getVisit(id);
      if (response.success && response.data) {
        setVisit(response.data);
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

  const handleDelete = async () => {
    if (!visit || !window.confirm('Are you sure you want to delete this visit?')) return;

    try {
      const response = await api.deleteVisit(visit.id);
      if (response.success) {
        navigate('/visits');
      } else {
        alert(response.error || 'Failed to delete visit');
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to delete visit');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      POSTPONED: 'bg-orange-100 text-orange-800 border-orange-200',
      NO_SHOW: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      SUCCESSFUL: 'bg-green-100 text-green-800 border-green-200',
      PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      UNSUCCESSFUL: 'bg-red-100 text-red-800 border-red-200',
      FOLLOW_UP_NEEDED: 'bg-orange-100 text-orange-800 border-orange-200',
      ORDER_PLACED: 'bg-teal-100 text-teal-800 border-teal-200',
      SAMPLE_GIVEN: 'bg-purple-100 text-purple-800 border-purple-200',
      INFORMATION_ONLY: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[outcome] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-neutral-600">Loading visit...</p>
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Visit not found'}
          </div>
          <button
            onClick={() => navigate('/visits')}
            className="mt-4 text-teal-600 hover:text-teal-700"
          >
            ← Back to Visits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/visits')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Visits
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Visit Details</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Created {new Date(visit.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/visits/${visit.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Outcome */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex gap-3 flex-wrap">
                <span className={`px-3 py-1.5 rounded-lg border ${getStatusColor(visit.status)}`}>
                  <strong>Status:</strong> {visit.status.replace(/_/g, ' ')}
                </span>
                <span className={`px-3 py-1.5 rounded-lg border ${getOutcomeColor(visit.outcome)}`}>
                  <strong>Outcome:</strong> {visit.outcome.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Visit Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Visit Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Date & Time</p>
                    <p className="text-neutral-900">{formatDateTime(visit.visitDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Visit Type</p>
                    <p className="text-neutral-900">{visit.visitType.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {visit.duration && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Duration</p>
                      <p className="text-neutral-900">{visit.duration} minutes</p>
                    </div>
                  </div>
                )}

                {(visit.latitude && visit.longitude) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-600">GPS Location</p>
                      <p className="text-neutral-900">
                        {visit.latitude.toFixed(6)}, {visit.longitude.toFixed(6)}
                      </p>
                      {visit.locationName && (
                        <p className="text-sm text-neutral-600 mt-1">{visit.locationName}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Purpose & Notes */}
            {(visit.purpose || visit.notes) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Details</h2>

                {visit.purpose && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-neutral-600 mb-1">Purpose</p>
                    <p className="text-neutral-900">{visit.purpose}</p>
                  </div>
                )}

                {visit.notes && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-1">Notes</p>
                    <p className="text-neutral-900 whitespace-pre-wrap">{visit.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Products */}
            {visit.products && visit.products.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Products Discussed</h2>
                <div className="flex flex-wrap gap-2">
                  {visit.products.map((product, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up */}
            {visit.followUpRequired && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">Follow-up Required</h3>

                    {visit.nextVisitDate && (
                      <p className="text-sm text-amber-800 mb-2">
                        <strong>Next Visit:</strong> {formatDateTime(visit.nextVisitDate)}
                      </p>
                    )}

                    {visit.followUpNotes && (
                      <p className="text-sm text-amber-800">{visit.followUpNotes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {visit.contact && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact</h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-neutral-900">{visit.contact.name}</p>
                      {visit.contact.designation && (
                        <p className="text-sm text-neutral-600">{visit.contact.designation}</p>
                      )}
                      {visit.contact.specialty && (
                        <p className="text-sm text-neutral-600">{visit.contact.specialty}</p>
                      )}
                    </div>
                  </div>

                  {visit.contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <a
                        href={`tel:${visit.contact.phone}`}
                        className="text-neutral-900 hover:text-teal-600"
                      >
                        {visit.contact.phone}
                      </a>
                    </div>
                  )}

                  {visit.contact.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <a
                        href={`mailto:${visit.contact.email}`}
                        className="text-neutral-900 hover:text-teal-600"
                      >
                        {visit.contact.email}
                      </a>
                    </div>
                  )}

                  {(visit.contact.hospitalName || visit.contact.clinicName) && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <p className="text-neutral-900">
                        {visit.contact.hospitalName || visit.contact.clinicName}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/contacts/${visit.contactId}`)}
                    className="w-full mt-2 px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    View Contact Details
                  </button>
                </div>
              </div>
            )}

            {/* Field Rep */}
            {visit.fieldRep && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Field Representative</h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-neutral-900">{visit.fieldRep.name}</p>
                      <p className="text-sm text-neutral-600">{visit.fieldRep.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
