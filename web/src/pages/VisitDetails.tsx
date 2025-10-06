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
            <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
              <AlertCircle className="w-16 h-16 text-danger-500 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Visit Not Found</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                {error || 'The visit you are looking for could not be found. It may have been deleted or you may not have permission to view it.'}
              </p>
              <button
                onClick={() => navigate('/visits')}
                className="btn-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Visits</span>
              </button>
            </div>
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
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Visits</span>
          </button>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="page-title">Visit Details</h1>
              <p className="page-subtitle">
                Created {new Date(visit.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              {visit.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => navigate(`/visits/${visit.id}/edit`)}
                  className="btn-primary"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Check Out</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
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
                {visit.checkInTime && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-success-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Check-In Time</p>
                      <p className="text-neutral-900">{formatDateTimeFull(visit.checkInTime)}</p>
                    </div>
                  </div>
                )}

                {visit.checkOutTime && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-danger-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Check-Out Time</p>
                      <p className="text-neutral-900">{formatDateTimeFull(visit.checkOutTime)}</p>
                    </div>
                  </div>
                )}

                {visit.duration && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-600">Duration</p>
                      <p className="text-neutral-900 font-semibold">{visit.duration} minutes</p>
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
                      <a
                        href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <MapPin className="w-4 h-4" />
                        Open in Google Maps
                      </a>
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
                    className="w-full mt-4 btn-secondary text-sm"
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
