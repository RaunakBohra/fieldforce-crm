import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, TableSkeleton, Pagination } from '../components/ui';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UsersList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Redirect if not admin or manager
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({
        page,
        limit: 20,
        role: roleFilter || undefined,
        search: search || undefined,
        status: statusFilter || undefined,
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await api.deactivateUser(userId);
      if (response.success) {
        alert('User deactivated successfully');
        fetchUsers();
      } else {
        alert(response.error || 'Failed to deactivate user');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to deactivate user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-danger-100 text-danger-700';
      case 'MANAGER': return 'bg-warn-100 text-warn-700';
      case 'FIELD_REP': return 'bg-primary-100 text-primary-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
    return null;
  }

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">User Management</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage users and their roles
                </p>
              </div>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/users/new')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:shadow-md transition-all min-h-[44px] shadow-sm"
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Add User</span>
              </button>
            )}
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <UsersIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px] bg-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="FIELD_REP">Field Rep</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all hover:border-neutral-400 text-sm min-h-[44px] bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all font-medium text-sm min-h-[44px]"
            >
              Search
            </button>
          </form>
        </Card>

        {/* Users Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={10}
              columns={6}
              headers={['Name', 'Email', 'Phone', 'Role', 'Status', 'Actions']}
            />
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              <p className="text-lg font-medium">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Role
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
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-neutral-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            label={user.isActive ? 'Active' : 'Inactive'}
                            className={user.isActive ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700'}
                            formatLabel={false}
                          />
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Edit
                            </button>
                            {user.isActive && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeactivate(user.id)}
                                className="text-danger-600 hover:text-danger-700"
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-neutral-200">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ContentSection>
    </PageContainer>
  );
}
