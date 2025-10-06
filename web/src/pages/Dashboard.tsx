import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardStats, DashboardActivity, TopPerformer } from '../services/api';
import {
  MapPin,
  ShoppingCart,
  DollarSign,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Users
} from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, LoadingSpinner } from '../components/ui';
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
      const [statsRes, activitiesRes, performersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(),
        isAdmin ? api.getTopPerformers() : Promise.resolve({ success: false, data: null }),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(activitiesRes.data.activities);
      }

      if (performersRes.success && performersRes.data) {
        setTopPerformers(performersRes.data.performers);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard');
    } finally {
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
        {/* Welcome Header */}
        <Card className="border-b border-neutral-200 rounded-none bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Welcome, {user?.name}!
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Here's what's happening with your business today
              </p>
            </div>
            <div className="text-right text-sm text-neutral-600">
              <p className="font-medium">{user?.role}</p>
              <p>{user?.email}</p>
            </div>
          </div>
        </Card>

        {/* Overview Stats */}
        <section className="mt-6 space-y-3">
          {/* Visits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Today's Visits"
              value={stats?.visits.today ?? 0}
              icon={MapPin}
              iconColor="text-primary-600"
              valueColor="text-primary-700"
              onClick={() => navigate('/visits')}
            />
            <StatCard
              title="This Week Visits"
              value={stats?.visits.thisWeek ?? 0}
              icon={MapPin}
              iconColor="text-primary-600"
              valueColor="text-primary-700"
              onClick={() => navigate('/visits')}
            />
            <StatCard
              title="This Month Visits"
              value={stats?.visits.thisMonth ?? 0}
              icon={MapPin}
              iconColor="text-primary-600"
              valueColor="text-primary-700"
              onClick={() => navigate('/visits')}
            />
          </div>

          {/* Orders */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <StatCard
              title="Total Orders"
              value={stats?.orders.total ?? 0}
              icon={ShoppingCart}
              iconColor="text-neutral-600"
              valueColor="text-neutral-900"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Pending Orders"
              value={stats?.orders.pending ?? 0}
              icon={Clock}
              iconColor="text-warn-600"
              valueColor="text-warn-600"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Approved Orders"
              value={stats?.orders.approved ?? 0}
              icon={CheckCircle2}
              iconColor="text-primary-600"
              valueColor="text-primary-600"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Delivered Orders"
              value={stats?.orders.delivered ?? 0}
              icon={Package}
              iconColor="text-success-600"
              valueColor="text-success-600"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Cancelled Orders"
              value={stats?.orders.cancelled ?? 0}
              icon={Package}
              iconColor="text-danger-600"
              valueColor="text-danger-600"
              onClick={() => navigate('/orders')}
            />
          </div>

          {/* Financials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.revenue.total ?? 0)}
              icon={DollarSign}
              iconColor="text-primary-600"
              valueColor="text-primary-700"
              subtitle="Delivered orders"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Collected Payments"
              value={formatCurrency(stats?.revenue.collected ?? 0)}
              icon={CreditCard}
              iconColor="text-success-600"
              valueColor="text-success-600"
              onClick={() => navigate('/payments')}
            />
            <StatCard
              title="Outstanding Payments"
              value={formatCurrency(stats?.revenue.outstanding ?? 0)}
              icon={TrendingUp}
              iconColor="text-warn-600"
              valueColor="text-warn-600"
              onClick={() => navigate('/payments/pending')}
            />
          </div>
        </section>

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
        <section className="mt-6">
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Recent Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.type === 'visit') navigate('/visits');
                      if (activity.type === 'order') navigate('/orders');
                      if (activity.type === 'payment') navigate('/payments');
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'visit' ? 'bg-primary-100' :
                        activity.type === 'order' ? 'bg-warn-100' :
                        'bg-success-100'
                      }`}>
                        {activity.type === 'visit' && <MapPin className="w-5 h-5 text-primary-600" />}
                        {activity.type === 'order' && <ShoppingCart className="w-5 h-5 text-warn-600" />}
                        {activity.type === 'payment' && <CreditCard className="w-5 h-5 text-success-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{activity.title}</p>
                        <p className="text-sm text-neutral-500">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {activity.status && (
                        <StatusBadge
                          label={activity.status}
                          className="text-xs"
                          formatLabel
                        />
                      )}
                      {activity.amount && (
                        <p className="font-semibold text-neutral-900 min-w-[100px] text-right">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/visits/new')}
              className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-left"
            >
              <MapPin className="w-6 h-6 mb-2" />
              <p className="font-semibold">Schedule Visit</p>
              <p className="text-sm text-primary-100">Plan a customer visit</p>
            </button>
            <button
              onClick={() => navigate('/orders/new')}
              className="p-4 bg-warn-600 text-white rounded-lg hover:bg-warn-700 transition-colors text-left"
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              <p className="font-semibold">Create Order</p>
              <p className="text-sm text-warn-100">Place a new order</p>
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="p-4 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors text-left"
            >
              <CreditCard className="w-6 h-6 mb-2" />
              <p className="font-semibold">Record Payment</p>
              <p className="text-sm text-success-100">Add payment record</p>
            </button>
            <button
              onClick={() => navigate('/contacts/new')}
              className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-left"
            >
              <Users className="w-6 h-6 mb-2" />
              <p className="font-semibold">Add Contact</p>
              <p className="text-sm text-primary-100">Create new contact</p>
            </button>
          </div>
        </section>
      </ContentSection>
    </PageContainer>
  );
}
