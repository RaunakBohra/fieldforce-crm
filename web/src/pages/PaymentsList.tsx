import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { api } from '../services/api';
import type { PaymentStats, PaymentQueryParams } from '../services/api';
import { Search, Filter, DollarSign, Plus, FileText } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';
import { exportPaymentsToPDF } from '../utils/exportUtils';

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
  const listRef = useRef<any>(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Debounce search to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 100; // Increased for virtual scrolling

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
        // Enable virtual scrolling if we have more than 50 items
        setUseVirtualScrolling(response.data.payments.length > 50);
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

  // PaymentRow component for virtual scrolling
  const PaymentRow = ({ index, style, ariaAttributes }: any) => {
    const payment = payments[index];
    if (!payment) return null;

    return (
      <div style={style} className="border-b border-neutral-200 hover:bg-neutral-50" {...ariaAttributes}>
        <div className="grid grid-cols-7 gap-4 px-6 py-4">
          <div className="col-span-1 flex items-center">
            <div className="text-sm font-medium text-neutral-900">{payment.paymentNumber}</div>
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-500">
            {payment.order?.orderNumber || '-'}
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-500">
            {payment.order?.contact.name || '-'}
          </div>
          <div className="col-span-1 flex items-center text-sm font-semibold text-success-600">
            {formatCurrency(payment.amount)}
          </div>
          <div className="col-span-1 flex items-center">
            <StatusBadge
              label={payment.paymentMode}
              variant="primary"
              formatLabel={false}
            />
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-500">
            {payment.referenceNumber || '-'}
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-500">
            {formatDate(payment.paymentDate)}
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
              <h1 className="page-title">Payments</h1>
              <p className="page-subtitle">
                Track and manage payment records
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/payments/pending')}
                className="btn-warn"
              >
                <span className="font-medium">View Pending</span>
              </button>
              <button
                onClick={() => exportPaymentsToPDF(payments)}
                disabled={payments.length === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                title="Export to PDF"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => navigate('/payments/new')}
                className="btn-primary"
              >
                <span className="font-medium">Record Payment</span>
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
            <h2 className="section-heading mb-4">Payment Mode Breakdown</h2>
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
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Filter className="icon-status" />
            <h2 className="section-heading">Filters</h2>
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                Active
              </span>
            )}
          </div>

          <div className="space-y-3 md:space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="icon-search" />
              <input
                type="text"
                placeholder="Search by contact name, order, payment, or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-search"
              />
            </div>

            {/* Filter Row 1: Dates and Payment Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="select-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className="select-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Mode</label>
                <select
                  value={filter.paymentMode}
                  onChange={(e) => setFilter({ ...filter, paymentMode: e.target.value })}
                  className="select-field"
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

            {/* Filter Row 2: Amount Range and Reset */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filter.minAmount}
                  onChange={(e) => setFilter({ ...filter, minAmount: e.target.value })}
                  placeholder="e.g., 1000"
                  className="input-field"
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
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">&nbsp;</label>
                <button
                  onClick={resetFilters}
                  className="w-full btn-ghost"
                >
                  Reset Filters
                </button>
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
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <DollarSign className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Payments Yet</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Start tracking your payments by recording the first one. Keep track of all transactions in one place.
              </p>
              <button onClick={() => navigate('/payments/new')} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200">
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment #</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Mode</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reference</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</div>
              </div>

              {/* Table Body - Virtual Scrolling or Regular */}
              {useVirtualScrolling ? (
                <List
                  listRef={listRef}
                  defaultHeight={600}
                  rowCount={payments.length}
                  rowHeight={80}
                  rowComponent={PaymentRow}
                  rowProps={{}}
                />
              ) : (
                <div className="bg-white">
                  {payments.map((payment, index) => (
                    <PaymentRow key={payment.id} index={index} style={{}} />
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
