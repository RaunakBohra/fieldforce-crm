import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { VisitTrend, RevenueData, PaymentModeData } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { LoadingSpinner } from '../components/ui';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils';

// Color palette matching theme
const COLORS = {
  primary: '#2563eb', // primary-600 (blue)
  secondary: '#f59e0b', // warn-500 (amber/yellow for warnings)
  success: '#10b981', // success-500 (emerald)
  danger: '#ef4444', // danger-500 (red)
  neutral: '#6b7280', // neutral-500 (gray)
};

const PAYMENT_MODE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.neutral,
  COLORS.danger,
];

type DateRange = 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export default function Analytics() {
  const [visitTrends, setVisitTrends] = useState<VisitTrend[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentModeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (dateRange) {
      case 'last7days':
        start = subDays(today, 7);
        break;
      case 'last30days':
        start = subDays(today, 30);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          start = subDays(today, 30);
        } else {
          return {
            startDate: customStartDate,
            endDate: customEndDate,
          };
        }
        break;
      default:
        start = subDays(today, 30);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const [visitRes, revenueRes, paymentRes] = await Promise.all([
        api.getVisitTrends(startDate, endDate),
        api.getOrdersRevenue(startDate, endDate),
        api.getPaymentModes(startDate, endDate),
      ]);

      if (visitRes.success && visitRes.data) {
        setVisitTrends(visitRes.data.trends);
      }

      if (revenueRes.success && revenueRes.data) {
        setRevenueData(revenueRes.data.trends);
      }

      if (paymentRes.success && paymentRes.data) {
        setPaymentModes(paymentRes.data.paymentModes);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Format date for charts (MMM DD)
  const formatChartDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return dateStr;
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
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Analytics & Charts</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Visualize your business data and trends
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRange === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Visit Trends Chart */}
        <section className="mt-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Visit Trends</h2>
                <p className="text-sm text-neutral-500">Track daily visit activity</p>
              </div>
            </div>

            {visitTrends.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No visit data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visitTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    labelFormatter={formatChartDate}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Total Visits"
                    dot={{ fill: COLORS.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Completed"
                    dot={{ fill: COLORS.success }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    name="Cancelled"
                    dot={{ fill: COLORS.danger }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>

        {/* Revenue & Orders Chart */}
        <section className="mt-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Revenue & Orders</h2>
                <p className="text-sm text-neutral-500">Track revenue from delivered orders</p>
              </div>
            </div>

            {revenueData.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No revenue data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    labelFormatter={formatChartDate}
                    formatter={(value: number, name: string) => {
                      if (name.includes('Revenue')) {
                        return [formatCurrency(value), name];
                      }
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="totalOrders"
                    fill={COLORS.neutral}
                    name="Total Orders"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="deliveredOrders"
                    fill={COLORS.success}
                    name="Delivered Orders"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="deliveredRevenue"
                    fill={COLORS.primary}
                    name="Delivered Revenue"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>

        {/* Payment Modes Chart */}
        <section className="mt-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Payment Modes Distribution</h2>
                <p className="text-sm text-neutral-500">Breakdown by payment method</p>
              </div>
            </div>

            {paymentModes.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No payment data available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentModes as any}
                        dataKey="total"
                        nameKey="mode"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.mode}: ${entry.percentage.toFixed(1)}%`}
                        labelLine={{ stroke: COLORS.neutral }}
                      >
                        {paymentModes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PAYMENT_MODE_COLORS[index % PAYMENT_MODE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Payment Mode Stats Table */}
                <div className="space-y-3">
                  {paymentModes.map((mode, index) => (
                    <div
                      key={mode.mode}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: PAYMENT_MODE_COLORS[index % PAYMENT_MODE_COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-neutral-900">{mode.mode}</p>
                          <p className="text-sm text-neutral-500">{mode.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-700">{formatCurrency(mode.total)}</p>
                        <p className="text-sm text-neutral-500">{mode.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>
      </ContentSection>
    </PageContainer>
  );
}
