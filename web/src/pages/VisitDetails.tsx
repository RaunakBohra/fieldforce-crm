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
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, LoadingSpinner } from '../components/ui';
import { formatDateTimeFull, getVisitStatusColor, getVisitOutcomeColor, formatStatusLabel } from '../utils';

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

  if (loading) {
    return (
      <PageContainer>
        <ContentSection>
          <LoadingSpinner message="Loading visit..." />
        </ContentSection>
      </PageContainer>
    );
  }

  if (error || !visit) {
    return (
      <PageContainer>
        <ContentSection maxWidth="4xl">
          <Card>
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
              {error || 'Visit not found'}
            </div>
            <button
              onClick={() => navigate('/visits')}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              ← Back to Visits
            </button>
          </Card>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection maxWidth="5xl">
        {/* Header */}
        <Card className="mb-6">
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
                className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Outcome */}
            <Card>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <strong className="text-neutral-900">Status:</strong>
                  <StatusBadge
                    label={visit.status}
                    className={`${getVisitStatusColor(visit.status)} border`}
                    formatLabel
                  />
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-neutral-900">Outcome:</strong>
                  <StatusBadge
                    label={visit.outcome}
                    className={`${getVisitOutcomeColor(visit.outcome)} border`}
                    formatLabel
                  />
                </div>
              </div>
            </Card>

            {/* Visit Information */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Visit Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Date & Time</p>
                    <p className="text-neutral-900">{formatDateTimeFull(visit.visitDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-600">Visit Type</p>
                    <p className="text-neutral-900">{formatStatusLabel(visit.visitType)}</p>
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
            </Card>

            {/* Purpose & Notes */}
            {(visit.purpose || visit.notes) && (
              <Card>
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
              </Card>
            )}

            {/* Products */}
            {visit.products && visit.products.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Products Discussed</h2>
                <div className="flex flex-wrap gap-2">
                  {visit.products.map((product, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Follow-up */}
            {visit.followUpRequired && (
              <Card className="bg-warn-50 border-warn-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warn-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-warn-900 mb-2">Follow-up Required</h3>

                    {visit.nextVisitDate && (
                      <p className="text-sm text-warn-800 mb-2">
                        <strong>Next Visit:</strong> {formatDateTimeFull(visit.nextVisitDate)}
                      </p>
                    )}

                    {visit.followUpNotes && (
                      <p className="text-sm text-warn-800">{visit.followUpNotes}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {visit.contact && (
              <Card>
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
                        className="text-neutral-900 hover:text-primary-600"
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
                        className="text-neutral-900 hover:text-primary-600"
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
              </Card>
            )}

            {/* Field Rep */}
            {visit.fieldRep && (
              <Card>
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
              </Card>
            )}
          </div>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
