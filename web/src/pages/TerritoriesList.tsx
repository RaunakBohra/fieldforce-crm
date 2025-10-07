import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Territory } from '../services/api';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, TableSkeleton, Pagination, showToast } from '../components/ui';
import { Plus, Search, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TerritoriesList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [countryFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');

  // Redirect if not admin or manager
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchTerritories();
  }, [page, typeFilter, countryFilter, isActiveFilter]);

  const fetchTerritories = async () => {
    try {
      setLoading(true);
      const response = await api.getTerritories({
        page,
        limit: 20,
        type: typeFilter || undefined,
        country: countryFilter || undefined,
        search: search || undefined,
        isActive: isActiveFilter || undefined,
      });

      if (response.success && response.data) {
        setTerritories(response.data.territories);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch territories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTerritories();
  };

  const handleDelete = async (territoryId: string, territoryName: string) => {
    showToast.confirm(
      'Delete territory?',
      `Are you sure you want to delete "${territoryName}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await api.deleteTerritory(territoryId);
          if (response.success) {
            showToast.success('Territory deleted successfully');
            fetchTerritories();
          } else {
            showToast.error(response.error || 'Failed to delete territory');
          }
        } catch (error: any) {
          showToast.error(error.message || 'Failed to delete territory');
        }
      }
    );
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'COUNTRY': return 'bg-danger-100 text-danger-700';
      case 'STATE': return 'bg-warn-100 text-warn-700';
      case 'CITY': return 'bg-primary-100 text-primary-700';
      case 'DISTRICT': return 'bg-success-100 text-success-700';
      case 'ZONE': return 'bg-neutral-100 text-neutral-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  // Mobile Card View Component
  const TerritoryMobileCard = ({ territory }: { territory: Territory }) => (
    <div
      className="p-4 border-b border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
      onClick={() => navigate(`/territories/${territory.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-neutral-900">{territory.name}</h3>
          <p className="text-sm text-neutral-600 mt-0.5 font-mono">{territory.code}</p>
        </div>
        <StatusBadge label={territory.isActive ? 'active' : 'inactive'} />
      </div>

      <div className="space-y-2">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(territory.type)}`}>
          {territory.type}
        </span>

        <div className="text-sm space-y-1">
          {(territory.city || territory.state || territory.country) && (
            <p className="text-neutral-700">
              <span className="font-medium">Location:</span> {territory.city || territory.state || territory.country}
            </p>
          )}
          {territory.parent && (
            <p className="text-neutral-600">
              <span className="font-medium">Parent:</span> {territory.parent.name}
            </p>
          )}
          <p className="text-neutral-600">
            <span className="font-medium">Users:</span> {territory._count?.users || 0}
            {territory._count && territory._count.children > 0 && (
              <span className="ml-2">• {territory._count.children} sub-territories</span>
            )}
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/territories/${territory.id}/edit`);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(territory.id, territory.name);
              }}
              disabled={!!territory._count && (territory._count.users > 0 || territory._count.children > 0)}
              className="px-3 py-2 text-sm font-medium text-danger-700 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
    return null;
  }

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="page-title">Territory Management</h1>
                <p className="page-subtitle">
                  Manage territories and geographic regions
                </p>
              </div>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/territories/new')}
                className="btn-primary"
              >
                <Plus className="icon-btn" />
                <span className="font-medium">Add Territory</span>
              </button>
            )}
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="icon-status" />
            <h2 className="section-heading">Filters</h2>
          </div>

          <form onSubmit={handleSearch} className="filter-grid">
            <div className="relative">
              <Search className="icon-search" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, or description..."
                className="input-search"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="select-field"
            >
              <option value="">All Types</option>
              <option value="COUNTRY">Country</option>
              <option value="STATE">State</option>
              <option value="CITY">City</option>
              <option value="DISTRICT">District</option>
              <option value="ZONE">Zone</option>
            </select>
            <select
              value={isActiveFilter}
              onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
              className="select-field"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button
              type="submit"
              className="btn-ghost"
            >
              Search
            </button>
          </form>
        </Card>

        {/* Territories Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={10}
              columns={7}
              headers={['Name', 'Code', 'Type', 'Location', 'Users', 'Status', 'Actions']}
            />
          ) : territories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <MapPin className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Territories Found</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                {currentUser?.role === 'ADMIN'
                  ? 'Start organizing your field force by creating territories. Define regions and assign team members.'
                  : 'No territories match your current filters. Try adjusting your search criteria.'}
              </p>
              {currentUser?.role === 'ADMIN' && (
                <button onClick={() => navigate('/territories/new')} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Add Territory</span>
                </button>
              )}
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="bg-white">
              {territories.map((territory) => (
                <TerritoryMobileCard key={territory.id} territory={territory} />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      {currentUser?.role === 'ADMIN' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {territories.map((territory) => (
                      <tr
                        key={territory.id}
                        className="hover:bg-neutral-50 cursor-pointer"
                        onClick={() => navigate(`/territories/${territory.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {territory.name}
                          </div>
                          {territory.description && (
                            <div className="text-sm text-neutral-500 truncate max-w-xs">
                              {territory.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900 font-mono">
                            {territory.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(territory.type)}`}>
                            {territory.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {territory.city || territory.state || territory.country}
                          </div>
                          {territory.parent && (
                            <div className="text-xs text-neutral-500">
                              Parent: {territory.parent.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {territory._count?.users || 0} users
                          </div>
                          {territory._count && territory._count.children > 0 && (
                            <div className="text-xs text-neutral-500">
                              {territory._count.children} sub-territories
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge label={territory.isActive ? 'active' : 'inactive'} />
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/territories/${territory.id}/edit`);
                              }}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(territory.id, territory.name);
                              }}
                              className="text-danger-600 hover:text-danger-900"
                              disabled={!!territory._count && (territory._count.users > 0 || territory._count.children > 0)}
                              title={territory._count && (territory._count.users > 0 || territory._count.children > 0)
                                ? 'Cannot delete territory with users or sub-territories'
                                : 'Delete territory'}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-neutral-200">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </ContentSection>
    </PageContainer>
  );
}
