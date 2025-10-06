import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, ContactStats } from '../services/api';
import { Pencil, Trash2, Plus, Search, Filter } from 'lucide-react';

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [currentPage, categoryFilter, typeFilter, cityFilter, searchTerm]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
      };

      if (categoryFilter !== 'ALL') params.contactCategory = categoryFilter;
      if (typeFilter !== 'ALL') params.contactType = typeFilter;
      if (cityFilter) params.city = cityFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await api.getContacts(params);
      if (response.success && response.data) {
        setContacts(response.data.contacts);
        setTotalPages(Math.ceil(response.data.total / limit));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contacts');
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
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
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
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Contacts</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Manage your distribution and medical contacts
              </p>
            </div>
            <button
              onClick={() => navigate('/contacts/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Contact
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Total Contacts</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Distribution</p>
                <p className="text-2xl font-bold text-primary-800">{stats.distribution}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Medical</p>
                <p className="text-2xl font-bold text-accent-600">{stats.medical}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
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
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-800 focus:border-transparent"
            />

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Contacts Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-neutral-600">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              No contacts found. Click "Add Contact" to create one.
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.contactCategory === 'DISTRIBUTION'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-accent-100 text-accent-600'
                        }`}>
                          {contact.contactCategory}
                        </span>
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {contact.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                          className="text-red-600 hover:text-red-700"
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
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-neutral-700">
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
      </div>
    </div>
  );
}
