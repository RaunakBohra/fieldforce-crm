import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { api } from '../services/api';
import type { Visit, VisitStats, VisitQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Pencil, Trash2, Plus, Search, MapPin, Calendar, Eye, Clock, Download, FileText } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, Pagination, TableSkeleton, showToast } from '../components/ui';
import { formatDateTime, getVisitStatusColor, getVisitOutcomeColor } from '../utils';
import { exportVisitsToCSV, exportVisitReportToPDF } from '../utils/exportUtils';

export function VisitsList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef<any>(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 100; // Increased for virtual scrolling

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [currentPage, statusFilter, outcomeFilter, startDate, endDate, debouncedSearch]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params: VisitQueryParams = {
        page: currentPage,
        limit,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (outcomeFilter !== 'ALL') params.outcome = outcomeFilter;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.getVisits(params);
      if (response.success && response.data) {
        setVisits(response.data.visits);
        setTotalPages(response.data.totalPages);
        // Enable virtual scrolling if we have more than 50 items
        setUseVirtualScrolling(response.data.visits.length > 50);
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
    showToast.confirm(
      `Delete visit to ${contactName}?`,
      'This action cannot be undone.',
      async () => {
        try {
          const response = await api.deleteVisit(id);
          if (response.success) {
            fetchVisits();
            fetchStats();
            showToast.success('Visit deleted successfully');
          }
        } catch (err) {
          const error = err as Error;
          showToast.error(error.message || 'Failed to delete visit');
        }
      }
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setOutcomeFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Mobile Card View Component
  const VisitMobileCard = ({ visit }: { visit: Visit }) => (
    <div className="p-4 border-b border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-neutral-900">
            {visit.contact?.name || 'N/A'}
          </h3>
          {visit.checkInTime && (
            <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(visit.checkInTime)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/visits/${visit.id}`);
            }}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="View details"
          >
            <Eye className="w-5 h-5" />
          </button>
          {visit.status === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/visits/${visit.id}/edit`);
              }}
              className="p-2 text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
              aria-label="Check out"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(visit.id, visit.contact?.name || 'this visit');
            }}
            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            aria-label="Delete visit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={visit.status}
            className={getVisitStatusColor(visit.status)}
            formatLabel
          />
          <StatusBadge
            label={visit.outcome}
            className={getVisitOutcomeColor(visit.outcome)}
            formatLabel
          />
        </div>

        <div className="text-sm space-y-1">
          {visit.status === 'IN_PROGRESS' ? (
            <p className="text-primary-600 font-medium">In Progress</p>
          ) : visit.duration ? (
            <p className="text-neutral-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span><span className="font-medium">Duration:</span> {visit.duration} min</span>
            </p>
          ) : null}

          {visit.locationName && (
            <p className="text-neutral-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span><span className="font-medium">Location:</span> {visit.locationName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // VisitRow component for virtual scrolling (Desktop)
  const VisitRow = ({ index, style, ariaAttributes }: any) => {
    const visit = visits[index];
    if (!visit) return null;

    return (
      <div style={style} className="border-b border-neutral-200 hover:bg-neutral-50" {...ariaAttributes}>
        <div className="grid grid-cols-7 gap-4 px-6 py-4">
          <div className="col-span-1 flex items-center">
            <div className="text-sm font-medium text-neutral-900">
              {visit.contact?.name || 'N/A'}
            </div>
          </div>
          <div className="col-span-1 flex items-center">
            {visit.checkInTime ? (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-900">
                  {formatDateTime(visit.checkInTime)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-neutral-500">-</span>
            )}
          </div>
          <div className="col-span-1 flex items-center">
            {visit.status === 'IN_PROGRESS' ? (
              <span className="text-sm font-medium text-primary-600">In Progress</span>
            ) : visit.duration ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-900">{visit.duration} min</span>
              </div>
            ) : (
              <span className="text-sm text-neutral-500">-</span>
            )}
          </div>
          <div className="col-span-1 flex items-center">
            <StatusBadge
              label={visit.status}
              className={getVisitStatusColor(visit.status)}
              formatLabel
            />
          </div>
          <div className="col-span-1 flex items-center">
            <StatusBadge
              label={visit.outcome}
              className={getVisitOutcomeColor(visit.outcome)}
              formatLabel
            />
          </div>
          <div className="col-span-1 flex items-center">
            {visit.locationName ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-900">{visit.locationName}</span>
              </div>
            ) : (
              <span className="text-sm text-neutral-500">-</span>
            )}
          </div>
          <div className="col-span-1 flex items-center justify-end gap-4">
            <button
              onClick={() => navigate(`/visits/${visit.id}`)}
              className="text-primary-600 hover:text-primary-700"
              title="View Details"
            >
              <Eye className="w-4 h-4 inline" />
            </button>
            {visit.status === 'IN_PROGRESS' && (
              <button
                onClick={() => navigate(`/visits/${visit.id}/edit`)}
                className="text-primary-800 hover:text-primary-700"
                title="Check Out"
              >
                <Pencil className="w-4 h-4 inline" />
              </button>
            )}
            <button
              onClick={() => handleDelete(visit.id, visit.contact?.name || 'this visit')}
              className="text-danger-600 hover:text-danger-500"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1">
              <h1 className="page-title">Visits</h1>
              <p className="page-subtitle">
                Track and manage field visits
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportVisitsToCSV(visits)}
                disabled={visits.length === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => exportVisitReportToPDF(visits)}
                disabled={visits.length === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                title="Export to PDF"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => navigate('/visits/new')}
                className="btn-primary"
              >
                <Plus className="icon-btn" />
                <span className="font-medium">New Visit</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 overflow-x-auto">
              <div className="grid grid-cols-4 gap-4 min-w-max">
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">TOTAL VISITS</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.totalVisits}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">COMPLETED</div>
                  <div className="text-2xl font-bold text-success-600">{stats.completedVisits}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">PLANNED</div>
                  <div className="text-2xl font-bold text-primary-600">{stats.plannedVisits}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">THIS MONTH</div>
                  <div className="text-2xl font-bold text-primary-800">{stats.monthVisits}</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="icon-status" />
            <h2 className="section-heading">Filters</h2>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="relative">
                <Search className="icon-search" />
                <input
                  type="text"
                  placeholder="Search visits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-search"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field"
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
                className="select-field"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="select-field"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="select-field"
                placeholder="End Date"
              />

              <button
                onClick={resetFilters}
                className="btn-ghost"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 error-message">
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
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <MapPin className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Visits Yet</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Start tracking your field visits. Record visits to contacts and build better relationships.
              </p>
              <button onClick={() => navigate('/visits/new')} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>New Visit</span>
              </button>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="bg-white">
              {visits.map((visit) => (
                <VisitMobileCard key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200">
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Check-In</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Duration</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Outcome</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</div>
                <div className="col-span-1 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</div>
              </div>

              {/* Table Body - Virtual Scrolling or Regular */}
              {useVirtualScrolling ? (
                <List
                  listRef={listRef}
                  defaultHeight={600}
                  rowCount={visits.length}
                  rowHeight={80}
                  rowComponent={VisitRow}
                  rowProps={{}}
                />
              ) : (
                <div className="bg-white">
                  {visits.map((visit, index) => (
                    <VisitRow key={visit.id} index={index} style={{}} />
                  ))}
                </div>
              )}
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
