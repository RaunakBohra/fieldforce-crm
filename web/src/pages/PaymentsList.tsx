import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { PaymentStats, PaymentQueryParams } from '../services/api';
import { Search, Filter, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  referenceNumber?: string;
  order?: {
    orderNumber: string;
    contact: { name: string };
  };
}

export default function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    paymentMode: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });
  const navigate = useNavigate();

  // Debounce search to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filter, currentPage, debouncedSearch]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: PaymentQueryParams = {
        page: currentPage,
        limit,
      };

      if (filter.paymentMode) params.paymentMode = filter.paymentMode;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;
      if (filter.minAmount) params.minAmount = filter.minAmount;
      if (filter.maxAmount) params.maxAmount = filter.maxAmount;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.getPayments(params);
      if (response.success && response.data) {
        setPayments(response.data.payments);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;

      const response = await api.getPaymentStats(params);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilter({
      paymentMode: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filter.paymentMode || filter.startDate || filter.endDate || filter.minAmount || filter.maxAmount;

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Payments</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Track and manage payment records
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/payments/pending')}
                className="px-4 py-2 bg-warn-600 text-white rounded-lg hover:bg-warn-500 transition-colors"
              >
                View Pending
              </button>
              <button
                onClick={() => navigate('/payments/new')}
                className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                + Record Payment
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 overflow-x-auto">
              <div className="grid grid-cols-4 gap-4 min-w-max">
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">TOTAL PAYMENTS</div>
                  <div className="text-2xl font-bold text-primary-600">{stats.totalPayments}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">TOTAL AMOUNT</div>
                  <div className="text-2xl font-bold text-success-600">{formatCurrency(stats.totalAmount)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">AVG PAYMENT</div>
                  <div className="text-2xl font-bold text-primary-600">{formatCurrency(parseFloat(stats.averagePayment))}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-neutral-600 mb-2">OUTSTANDING</div>
                  <div className="text-2xl font-bold text-danger-600">{formatCurrency(stats.totalOutstanding)}</div>
                  <div className="text-xs text-neutral-500 mt-1">{stats.outstandingCount} orders</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment Mode Breakdown */}
        {stats?.paymentModes && Object.keys(stats.paymentModes).length > 0 && (
          <Card className="mt-6 border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4">Payment Mode Breakdown</h2>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-4 min-w-max">
                {Object.entries(stats.paymentModes).map(([mode, amount]) => (
                  <div key={mode} className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">{mode}</div>
                    <div className="text-2xl font-bold text-primary-600">{formatCurrency(amount as number)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
              {hasActiveFilters && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                  Active
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by contact name, order, payment, or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row 1: Dates and Payment Mode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Mode</label>
                <select
                  value={filter.paymentMode}
                  onChange={(e) => setFilter({ ...filter, paymentMode: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>

            {/* Filter Row 2: Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filter.minAmount}
                  onChange={(e) => setFilter({ ...filter, minAmount: e.target.value })}
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Max Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filter.maxAmount}
                  onChange={(e) => setFilter({ ...filter, maxAmount: e.target.value })}
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={7}
              headers={['Payment #', 'Order', 'Contact', 'Amount', 'Mode', 'Reference', 'Date']}
            />
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm mt-1">Record your first payment to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Payment #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {payment.paymentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {payment.order?.orderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {payment.order?.contact.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-success-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={payment.paymentMode}
                          variant="primary"
                          formatLabel={false}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDate(payment.paymentDate)}
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
