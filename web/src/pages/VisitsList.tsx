import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Visit, VisitStats, VisitQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Pencil, Trash2, Plus, Search, MapPin, Calendar, Eye } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatDateTime, getVisitStatusColor, getVisitOutcomeColor, formatStatusLabel } from '../utils';

export function VisitsList() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [currentPage, statusFilter, typeFilter, outcomeFilter, startDate, endDate, debouncedSearch]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params: VisitQueryParams = {
        page: currentPage,
        limit,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.visitType = typeFilter;
      if (outcomeFilter !== 'ALL') params.outcome = outcomeFilter;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.getVisits(params);
      if (response.success && response.data) {
        setVisits(response.data.visits);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getVisitStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async (id: string, contactName: string) => {
    if (!window.confirm(`Are you sure you want to delete visit to ${contactName}?`)) return;

    try {
      const response = await api.deleteVisit(id);
      if (response.success) {
        fetchVisits();
        fetchStats();
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to delete visit');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setOutcomeFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Visits</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Track and manage field visits
              </p>
            </div>
            <button
              onClick={() => navigate('/visits/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Visit
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Visits"
                value={stats.totalVisits}
                valueColor="text-neutral-900"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Completed"
                value={stats.completedVisits}
                valueColor="text-success-600"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Planned"
                value={stats.plannedVisits}
                valueColor="text-primary-600"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="This Month"
                value={stats.monthVisits}
                valueColor="text-primary-800"
                className="bg-neutral-50 shadow-none"
              />
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="POSTPONED">Postponed</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNSUCCESSFUL">Unsuccessful</option>
              <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
              <option value="ORDER_PLACED">Order Placed</option>
              <option value="SAMPLE_GIVEN">Sample Given</option>
              <option value="INFORMATION_ONLY">Information Only</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="End Date"
            />

            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Visits Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={7}
              headers={['Date', 'Contact', 'Status', 'Outcome', 'Type', 'Location', 'Actions']}
            />
          ) : visits.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              No visits found. Click "New Visit" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-900">
                            {formatDateTime(visit.visitDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {visit.contact?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={visit.status}
                          className={getVisitStatusColor(visit.status)}
                          formatLabel
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={visit.outcome}
                          className={getVisitOutcomeColor(visit.outcome)}
                          formatLabel
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatStatusLabel(visit.visitType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visit.locationName ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-900">{visit.locationName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/visits/${visit.id}`)}
                          className="text-primary-600 hover:text-primary-700 mr-3"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => navigate(`/visits/${visit.id}/edit`)}
                          className="text-primary-800 hover:text-primary-700 mr-3"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(visit.id, visit.contact?.name || 'this visit')}
                          className="text-danger-600 hover:text-danger-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </ContentSection>
    </PageContainer>
  );
}
