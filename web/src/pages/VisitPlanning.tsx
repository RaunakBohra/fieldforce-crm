import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { UpcomingVisit, OverdueVisit } from '../services/api';
import { Calendar, AlertCircle, Clock, MapPin, CheckCircle2, Edit } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { showToast } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

interface GroupedVisits {
  overdue: OverdueVisit[];
  today: UpcomingVisit[];
  tomorrow: UpcomingVisit[];
  thisWeek: UpcomingVisit[];
  nextWeek: UpcomingVisit[];
  later: UpcomingVisit[];
}

export function VisitPlanning() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [overdueVisits, setOverdueVisits] = useState<OverdueVisit[]>([]);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<OverdueVisit | UpcomingVisit | null>(null);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const [upcomingRes, overdueRes] = await Promise.all([
        api.getUpcomingVisits(30), // Get next 30 days
        api.getOverdueVisits(),
      ]);

      if (upcomingRes.success && upcomingRes.data) {
        setUpcomingVisits(upcomingRes.data);
      }

      if (overdueRes.success && overdueRes.data) {
        setOverdueVisits(overdueRes.data);
      }
    } catch (error: any) {
      showToast.error('Failed to load visits', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (contact: OverdueVisit | UpcomingVisit) => {
    setSelectedContact(contact);
    setNewVisitDate('');
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedContact || !newVisitDate) return;

    try {
      setRescheduleLoading(true);
      const result = await api.updateContact(selectedContact.id, {
        nextVisitDate: newVisitDate,
      });

      if (result.success) {
        showToast.success('Visit rescheduled successfully');
        setRescheduleModalOpen(false);
        setSelectedContact(null);
        setNewVisitDate('');
        fetchVisits(); // Refresh the list
      } else {
        showToast.error(result.error || 'Failed to reschedule visit');
      }
    } catch (error: any) {
      showToast.error('Failed to reschedule visit', error.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const groupVisitsByTime = (): GroupedVisits => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    const grouped: GroupedVisits = {
      overdue: overdueVisits,
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
    };

    upcomingVisits.forEach((visit) => {
      const visitDate = new Date(visit.nextVisitDate);
      visitDate.setHours(0, 0, 0, 0);

      if (visitDate.getTime() === today.getTime()) {
        grouped.today.push(visit);
      } else if (visitDate.getTime() === tomorrow.getTime()) {
        grouped.tomorrow.push(visit);
      } else if (visitDate <= endOfWeek) {
        grouped.thisWeek.push(visit);
      } else if (visitDate <= endOfNextWeek) {
        grouped.nextWeek.push(visit);
      } else {
        grouped.later.push(visit);
      }
    });

    return grouped;
  };

  const formatVisitDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const VisitCard = ({ visit, isOverdue = false }: { visit: UpcomingVisit | OverdueVisit; isOverdue?: boolean }) => (
    <div className={`p-4 rounded-lg border transition-all hover:shadow-md ${
      isOverdue
        ? 'bg-danger-50 border-danger-200 hover:border-danger-300'
        : 'bg-white border-neutral-200 hover:border-primary-300'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate">{visit.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-neutral-600">{visit.contactType}</span>
            {isOverdue && 'daysPending' in visit && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
                {visit.daysPending} {visit.daysPending === 1 ? 'day' : 'days'} overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm text-neutral-500">
            <Clock className="w-4 h-4" />
            <span>{formatVisitDate(visit.nextVisitDate)}</span>
          </div>
          {visit.lastVisitDate && (
            <div className="text-xs text-neutral-500 mt-1">
              Last visit: {new Date(visit.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(`/visits/new?contactId=${visit.id}`)}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            Check In
          </button>
          <button
            onClick={() => handleReschedule(visit)}
            className="px-3 py-1.5 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );

  const VisitSection = ({ title, visits, icon: Icon, iconColor, isOverdue = false, emptyMessage }: {
    title: string;
    visits: (UpcomingVisit | OverdueVisit)[];
    icon: any;
    iconColor: string;
    isOverdue?: boolean;
    emptyMessage?: string;
  }) => {
    if (visits.length === 0 && emptyMessage) {
      return null; // Don't show empty sections
    }

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h2 className="text-lg font-semibold text-neutral-900">
            {title} ({visits.length})
          </h2>
        </div>
        {visits.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} isOverdue={isOverdue} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const groupedVisits = groupVisitsByTime();

  if (loading) {
    return (
      <PageContainer>
        <ContentSection maxWidth="4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-600">Loading visit schedule...</div>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const totalVisits = overdueVisits.length + upcomingVisits.length;

  return (
    <PageContainer>
      <ContentSection maxWidth="4xl">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Visit Planning</h1>
              <p className="text-neutral-600">
                Schedule and manage your field visits
              </p>
            </div>
            <button
              onClick={() => navigate('/contacts')}
              className="btn-secondary"
            >
              Manage Contacts
            </button>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-danger-50 to-white border-danger-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-danger-700">{groupedVisits.overdue.length}</div>
              <div className="text-sm text-neutral-600 mt-1">Overdue</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-warn-50 to-white border-warn-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-warn-700">{groupedVisits.today.length}</div>
              <div className="text-sm text-neutral-600 mt-1">Today</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-700">{groupedVisits.thisWeek.length}</div>
              <div className="text-sm text-neutral-600 mt-1">This Week</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-success-50 to-white border-success-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-700">{totalVisits}</div>
              <div className="text-sm text-neutral-600 mt-1">Total Planned</div>
            </div>
          </Card>
        </div>

        {/* No Visits Scheduled */}
        {totalVisits === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Visits Scheduled</h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Start planning your field visits by setting visit dates for your contacts
              </p>
              <button
                onClick={() => navigate('/contacts')}
                className="btn-primary"
              >
                Go to Contacts
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            {/* Overdue Section */}
            <VisitSection
              title="Overdue Visits"
              visits={groupedVisits.overdue}
              icon={AlertCircle}
              iconColor="text-danger-600"
              isOverdue
              emptyMessage="No overdue visits - great job!"
            />

            {/* Today Section */}
            <VisitSection
              title="Today"
              visits={groupedVisits.today}
              icon={Calendar}
              iconColor="text-warn-600"
              emptyMessage="No visits scheduled for today"
            />

            {/* Tomorrow Section */}
            <VisitSection
              title="Tomorrow"
              visits={groupedVisits.tomorrow}
              icon={Calendar}
              iconColor="text-primary-600"
              emptyMessage="No visits scheduled for tomorrow"
            />

            {/* This Week Section */}
            <VisitSection
              title="This Week"
              visits={groupedVisits.thisWeek}
              icon={Calendar}
              iconColor="text-primary-600"
              emptyMessage="No more visits this week"
            />

            {/* Next Week Section */}
            <VisitSection
              title="Next Week"
              visits={groupedVisits.nextWeek}
              icon={Calendar}
              iconColor="text-neutral-600"
              emptyMessage="No visits scheduled for next week"
            />

            {/* Later Section */}
            {groupedVisits.later.length > 0 && (
              <VisitSection
                title="Later"
                visits={groupedVisits.later}
                icon={Calendar}
                iconColor="text-neutral-500"
              />
            )}

            {/* All visits up to date */}
            {totalVisits > 0 && groupedVisits.overdue.length === 0 && (
              <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-success-600 flex-shrink-0" />
                <p className="text-success-700 font-medium">
                  All visits are up to date! Keep up the great work.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Reschedule Modal */}
        {rescheduleModalOpen && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Reschedule Visit
                </h3>
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-neutral-700 mb-1">
                  <span className="font-medium">Contact:</span> {selectedContact.name}
                </p>
                <p className="text-sm text-neutral-600">
                  Current visit date: {formatVisitDate(selectedContact.nextVisitDate)}
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="newVisitDate" className="block text-sm font-medium text-neutral-700 mb-2">
                  New Visit Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="newVisitDate"
                  value={newVisitDate}
                  onChange={(e) => setNewVisitDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  disabled={rescheduleLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={!newVisitDate || rescheduleLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rescheduleLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentSection>
    </PageContainer>
  );
}
