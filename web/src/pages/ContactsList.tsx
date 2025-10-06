import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, ContactStats, ContactQueryParams } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Pencil, Trash2, Plus, Search, Filter, Users } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, Pagination, TableSkeleton } from '../components/ui';

export function ContactsList() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DISTRIBUTION' | 'MEDICAL'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('');

  // Debounce search inputs to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedCity = useDebounce(cityFilter, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [currentPage, categoryFilter, typeFilter, debouncedCity, debouncedSearch]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params: ContactQueryParams = {
        page: currentPage,
        limit,
      };

      if (categoryFilter !== 'ALL') params.contactCategory = categoryFilter;
      if (typeFilter !== 'ALL') params.contactType = typeFilter;
      if (debouncedCity) params.city = debouncedCity;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.getContacts(params);
      if (response.success && response.data) {
        setContacts(response.data.contacts);
        setTotalPages(Math.ceil(response.data.total / limit));
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getContactStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await api.deleteContact(id);
      if (response.success) {
        fetchContacts();
        fetchStats();
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to delete contact');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setTypeFilter('ALL');
    setCityFilter('');
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1">
              <h1 className="page-title">Contacts</h1>
              <p className="page-subtitle">
                Manage your distribution and medical contacts
              </p>
            </div>
            <button onClick={() => navigate('/contacts/new')} className="btn-primary">
              <Plus className="icon-btn" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-3 gap-4 min-w-max">
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Total Contacts</div>
                    <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Distribution</div>
                    <div className="text-2xl font-bold text-primary-800">{stats.distribution}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Medical</div>
                    <div className="text-2xl font-bold text-success-600">{stats.medical}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px] bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="MEDICAL">Medical</option>
            </select>

            {/* City Filter */}
            <input
              type="text"
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px]"
            />

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all font-medium text-sm min-h-[44px]"
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

        {/* Contacts Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={7}
              headers={['Name', 'Category', 'Type', 'Contact', 'Location', 'Status', 'Actions']}
            />
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <Users className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Contacts Yet</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Get started by adding your first contact. Build your network of distribution and medical contacts.
              </p>
              <button onClick={() => navigate('/contacts/new')} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{contact.name}</div>
                        {contact.designation && (
                          <div className="text-sm text-neutral-500">{contact.designation}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={contact.contactCategory}
                          variant={contact.contactCategory === 'DISTRIBUTION' ? 'primary' : 'success'}
                          formatLabel={false}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {contact.contactType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{contact.phone || '-'}</div>
                        <div className="text-sm text-neutral-500">{contact.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {contact.city && contact.state ? `${contact.city}, ${contact.state}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={contact.isActive ? 'Active' : 'Inactive'}
                          variant={contact.isActive ? 'success' : 'neutral'}
                          formatLabel={false}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                          className="text-primary-800 hover:text-primary-700 mr-4"
                        >
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id, contact.name)}
                          className="text-danger-600 hover:text-danger-500"
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
