import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardStats, DashboardActivity, TopPerformer } from '../services/api';
import {
  MapPin,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, LoadingSpinner } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Progressive loading: Load stats first (fastest), show immediately
      const statsRes = await api.getDashboardStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        setLoading(false); // Show stats immediately
      }

      // Load secondary data in background (activities and performers)
      const [activitiesRes, performersRes] = await Promise.all([
        api.getRecentActivity(),
        isAdmin ? api.getTopPerformers() : Promise.resolve({ success: false, data: null }),
      ]);

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(activitiesRes.data.activities);
      }

      if (performersRes.success && performersRes.data) {
        setTopPerformers(performersRes.data.performers);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentSection>
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentSection>
          <Card className="bg-danger-50 border border-danger-200">
            <p className="text-danger-700">{error}</p>
          </Card>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection>
        {/* Compact Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-sm text-neutral-600">
              Here's what's happening with your business today
            </p>
          </div>
          <div className="text-sm text-neutral-600 text-right">
            <span className="font-medium text-primary-700">{user?.role}</span>
          </div>
        </div>

        {/* Key Metrics Row - Premium Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 hover-lift shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary-700 mb-1">Today's Visits</p>
                <p className="text-2xl font-bold text-primary-900">{stats?.visits.today ?? 0}</p>
                <p className="text-xs text-primary-600 mt-1">{stats?.visits.thisWeek ?? 0} this week</p>
              </div>
              <MapPin className="w-8 h-8 text-primary-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-warn-50 to-warn-100 border-warn-200 hover-lift shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-warn-700 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-warn-900">{stats?.orders.pending ?? 0}</p>
                <p className="text-xs text-warn-600 mt-1">{stats?.orders.total ?? 0} total</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-warn-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200 hover-lift shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-success-700 mb-1">Collected</p>
                <p className="text-2xl font-bold text-success-900">{formatCurrency(stats?.revenue.collected ?? 0)}</p>
                <p className="text-xs text-success-600 mt-1">Payments</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-danger-50 to-danger-100 border-danger-200 hover-lift shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-danger-700 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-danger-900">{formatCurrency(stats?.revenue.outstanding ?? 0)}</p>
                <p className="text-xs text-danger-600 mt-1">Due payments</p>
              </div>
              <Clock className="w-8 h-8 text-danger-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Quick Actions - Premium Design */}
        <section className="mb-6">
          <h2 className="section-heading mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/visits/new')}
              className="btn-quick-action bg-gradient-brand hover-lift glow-brand transition-all"
            >
              <MapPin className="w-6 h-6 mb-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm md:text-base mb-1">Schedule Visit</p>
                <p className="text-xs text-primary-100">Plan a customer visit</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/orders/new')}
              className="btn-quick-action bg-gradient-to-br from-warn-600 to-warn-700 hover-lift transition-all"
            >
              <ShoppingCart className="w-6 h-6 mb-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm md:text-base mb-1">Create Order</p>
                <p className="text-xs text-warn-100">Place a new order</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="btn-quick-action bg-gradient-to-br from-success-600 to-success-700 hover-lift transition-all"
            >
              <CreditCard className="w-6 h-6 mb-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm md:text-base mb-1">Record Payment</p>
                <p className="text-xs text-success-100">Add payment record</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/contacts/new')}
              className="btn-quick-action bg-gradient-accent hover-lift glow-accent transition-all"
            >
              <Users className="w-6 h-6 mb-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm md:text-base mb-1">Add Contact</p>
                <p className="text-xs text-accent-100">Create new contact</p>
              </div>
            </button>
          </div>
        </section>

        {/* Detailed Stats - Combined Card */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Overview Statistics</h2>

          {/* Visits */}
          <div className="mb-6 pb-6 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              Visits
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/visits')}
                className="text-center p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Today</div>
                <div className="text-xl font-bold text-primary-700">{stats?.visits.today ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/visits')}
                className="text-center p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">This Week</div>
                <div className="text-xl font-bold text-primary-700">{stats?.visits.thisWeek ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/visits')}
                className="text-center p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">This Month</div>
                <div className="text-xl font-bold text-primary-700">{stats?.visits.thisMonth ?? 0}</div>
              </button>
            </div>
          </div>

          {/* Orders */}
          <div className="mb-6 pb-6 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-neutral-600" />
              Orders
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Total</div>
                <div className="text-xl font-bold text-neutral-900">{stats?.orders.total ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-3 rounded-lg hover:bg-warn-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Pending</div>
                <div className="text-xl font-bold text-warn-600">{stats?.orders.pending ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-3 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Approved</div>
                <div className="text-xl font-bold text-primary-600">{stats?.orders.approved ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-3 rounded-lg hover:bg-success-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Delivered</div>
                <div className="text-xl font-bold text-success-600">{stats?.orders.delivered ?? 0}</div>
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-3 rounded-lg hover:bg-danger-50 transition-colors"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Cancelled</div>
                <div className="text-xl font-bold text-danger-600">{stats?.orders.cancelled ?? 0}</div>
              </button>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-600" />
              Financials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="text-center p-4 rounded-lg hover:bg-primary-50 transition-colors border border-neutral-200"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Total Revenue</div>
                <div className="text-xl font-bold text-primary-700">{formatCurrency(stats?.revenue.total ?? 0)}</div>
                <div className="text-xs text-neutral-500 mt-1">Delivered orders</div>
              </button>
              <button
                onClick={() => navigate('/payments')}
                className="text-center p-4 rounded-lg hover:bg-success-50 transition-colors border border-neutral-200"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Collected</div>
                <div className="text-xl font-bold text-success-600">{formatCurrency(stats?.revenue.collected ?? 0)}</div>
                <div className="text-xs text-neutral-500 mt-1">Payments received</div>
              </button>
              <button
                onClick={() => navigate('/payments/pending')}
                className="text-center p-4 rounded-lg hover:bg-warn-50 transition-colors border border-neutral-200"
              >
                <div className="text-xs font-medium text-neutral-600 mb-1">Outstanding</div>
                <div className="text-xl font-bold text-warn-600">{formatCurrency(stats?.revenue.outstanding ?? 0)}</div>
                <div className="text-xs text-neutral-500 mt-1">Pending payments</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Top Performers (Admin/Manager Only) */}
        {isAdmin && topPerformers.length > 0 && (
          <section className="mt-6">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Top Performers (This Month)
                </h2>
                <Users className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="space-y-3">
                {topPerformers.slice(0, 5).map((performer, index) => (
                  <div
                    key={performer.userId}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {performer.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {performer.totalOrders} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-700">
                        {formatCurrency(performer.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Recent Activity */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Activity
          </h2>
          {activities.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (activity.type === 'visit') navigate('/visits');
                    if (activity.type === 'order') navigate('/orders');
                    if (activity.type === 'payment') navigate('/payments');
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'visit' ? 'bg-primary-100' :
                      activity.type === 'order' ? 'bg-warn-100' :
                      'bg-success-100'
                    }`}>
                      {activity.type === 'visit' && <MapPin className="w-5 h-5 text-primary-600" />}
                      {activity.type === 'order' && <ShoppingCart className="w-5 h-5 text-warn-600" />}
                      {activity.type === 'payment' && <CreditCard className="w-5 h-5 text-success-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{activity.title}</p>
                      <p className="text-sm text-neutral-500 truncate">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    {activity.status && (
                      <StatusBadge
                        label={activity.status}
                        className="text-xs hidden sm:block"
                        formatLabel
                      />
                    )}
                    {activity.amount && (
                      <p className="font-semibold text-neutral-900 text-right min-w-[80px]">
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
