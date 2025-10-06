import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Visit, VisitStats, VisitQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Pencil, Trash2, Plus, Search, MapPin, Calendar, Eye } from 'lucide-react';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      POSTPONED: 'bg-orange-100 text-orange-800',
      NO_SHOW: 'bg-neutral-100 text-neutral-800',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      SUCCESSFUL: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      UNSUCCESSFUL: 'bg-red-100 text-red-800',
      FOLLOW_UP_NEEDED: 'bg-orange-100 text-orange-800',
      ORDER_PLACED: 'bg-green-100 text-green-800',
      SAMPLE_GIVEN: 'bg-purple-100 text-purple-800',
      INFORMATION_ONLY: 'bg-blue-100 text-blue-800',
    };
    return colors[outcome] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              Add Visit
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Total Visits</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalVisits}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Planned</p>
                <p className="text-2xl font-bold text-blue-900">{stats.plannedVisits}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{stats.completedVisits}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-600">This Month</p>
                <p className="text-2xl font-bold text-amber-900">{stats.monthVisits}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="POSTPONED">Postponed</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="FIELD_VISIT">Field Visit</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="PLANNED">Planned</option>
              <option value="COLD_CALL">Cold Call</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="EVENT">Event</option>
            </select>

            {/* Outcome Filter */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Date Range */}
          <div className="mt-4 flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <span className="text-neutral-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-neutral-600">Loading visits...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">No visits found</p>
            <button
              onClick={() => navigate('/visits/new')}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Add your first visit
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Outcome
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
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {visit.contact?.name || 'Unknown Contact'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {visit.contact?.designation} {visit.contact?.specialty && `• ${visit.contact.specialty}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{formatDate(visit.visitDate)}</div>
                        {visit.duration && (
                          <div className="text-sm text-neutral-500">{visit.duration} min</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-900">
                          {visit.visitType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                          {visit.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOutcomeColor(visit.outcome)}`}>
                          {visit.outcome.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visit.locationName ? (
                          <div className="flex items-center text-sm text-neutral-900">
                            <MapPin className="w-4 h-4 mr-1 text-neutral-400" />
                            {visit.locationName}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/visits/${visit.id}`)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/visits/${visit.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit visit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(visit.id, visit.contact?.name || 'this contact')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete visit"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-neutral-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
