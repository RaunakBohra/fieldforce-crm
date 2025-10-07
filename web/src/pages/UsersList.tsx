import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, TableSkeleton, Pagination } from '../components/ui';
import { Plus, Search, Users as UsersIcon, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UsersList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Mobile Card View Component
  const UserMobileCard = ({ user }: { user: User }) => (
    <div className="p-4 border-b border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-neutral-900">{user.name}</h3>
          <p className="text-sm text-neutral-600 mt-0.5">{user.email}</p>
        </div>
        <StatusBadge
          label={user.isActive ? 'Active' : 'Inactive'}
          className={user.isActive ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700'}
          formatLabel={false}
        />
      </div>

      <div className="space-y-2">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>

        {user.phone && (
          <p className="text-sm text-neutral-700">
            <span className="font-medium">Phone:</span> {user.phone}
          </p>
        )}

        {currentUser?.role === 'ADMIN' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate(`/users/${user.id}/edit`)}
              className="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              Edit
            </button>
            {user.isActive && user.id !== currentUser?.id && (
              <button
                onClick={() => handleDeactivate(user.id)}
                className="px-3 py-2 text-sm font-medium text-danger-700 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors"
              >
                Deactivate
              </button>
            )}
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
              <UsersIcon className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">
                  Manage users and their roles
                </p>
              </div>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/users/new')}
                className="btn-primary"
              >
                <Plus className="icon-btn" />
                <span className="font-medium">Add User</span>
              </button>
            )}
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <UsersIcon className="icon-status" />
            <h2 className="section-heading">Filters</h2>
          </div>

          <form onSubmit={handleSearch} className="filter-grid">
            <div className="relative">
              <Search className="icon-search" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="input-search"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="select-field"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="FIELD_REP">Field Rep</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="btn-ghost"
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
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <UserPlus className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Users Found</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                {currentUser?.role === 'ADMIN'
                  ? 'Start building your team by adding users. Assign roles and manage access.'
                  : 'No users match your current filters. Try adjusting your search criteria.'}
              </p>
              {currentUser?.role === 'ADMIN' && (
                <button onClick={() => navigate('/users/new')} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              )}
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="bg-white">
              {users.map((user) => (
                <UserMobileCard key={user.id} user={user} />
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
