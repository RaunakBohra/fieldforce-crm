import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

type ReportType = 'visits' | 'orders' | 'payments';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportType>('visits');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [activeTab, startDate, endDate, status, paymentStatus, paymentMode]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let response;

      const params = {
        startDate,
        endDate,
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(paymentMode && { paymentMode }),
      };

      if (activeTab === 'visits') {
        response = await api.getVisitsReport(params);
      } else if (activeTab === 'orders') {
        response = await api.getOrdersReport(params);
      } else {
        response = await api.getPaymentsReport(params);
      }

      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        startDate,
        endDate,
        format: 'csv' as const,
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(paymentMode && { paymentMode }),
      };

      if (activeTab === 'visits') {
        await api.getVisitsReport(params);
      } else if (activeTab === 'orders') {
        await api.getOrdersReport(params);
      } else {
        await api.getPaymentsReport(params);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Reports</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Generate and export reports for visits, orders, and payments
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-6 border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('visits')}
              className={`${
                activeTab === 'visits'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Visits Report
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Orders Report
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`${
                activeTab === 'payments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Payments Report
            </button>
          </nav>
        </div>

        {/* Filters */}
        <Card className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-600" />
            <h3 className="text-lg font-medium text-neutral-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Visit Status Filter */}
            {activeTab === 'visits' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}

            {/* Order Filters */}
            {activeTab === 'orders' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Order Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </>
            )}

            {/* Payment Mode Filter */}
            {activeTab === 'payments' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Cards */}
        {reportData && reportData.summary && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeTab === 'visits' && (
              <>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Total Visits</div>
                  <div className="mt-1 text-3xl font-bold text-neutral-900">{reportData.summary.total}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Completed</div>
                  <div className="mt-1 text-3xl font-bold text-success-600">{reportData.summary.completed}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Completion Rate</div>
                  <div className="mt-1 text-3xl font-bold text-primary-600">{reportData.summary.completionRate}%</div>
                </Card>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Total Orders</div>
                  <div className="mt-1 text-3xl font-bold text-neutral-900">{reportData.summary.total || 0}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Total Revenue</div>
                  <div className="mt-1 text-3xl font-bold text-success-600">₹{(reportData.summary.totalRevenue || 0).toLocaleString()}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Avg Order Value</div>
                  <div className="mt-1 text-3xl font-bold text-primary-600">₹{(reportData.summary.averageOrderValue || 0).toLocaleString()}</div>
                </Card>
              </>
            )}

            {activeTab === 'payments' && (
              <>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Total Payments</div>
                  <div className="mt-1 text-3xl font-bold text-neutral-900">{reportData.summary.total || 0}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Total Amount</div>
                  <div className="mt-1 text-3xl font-bold text-success-600">₹{(reportData.summary.totalAmount || 0).toLocaleString()}</div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-neutral-600">Avg Payment</div>
                  <div className="mt-1 text-3xl font-bold text-primary-600">₹{(reportData.summary.averagePayment || 0).toLocaleString()}</div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Data Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">Loading report...</p>
            </div>
          ) : reportData && reportData[activeTab] ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    {activeTab === 'visits' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Field Rep</th>
                      </>
                    )}
                    {activeTab === 'orders' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Payment</th>
                      </>
                    )}
                    {activeTab === 'payments' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Reference</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {reportData[activeTab].map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      {activeTab === 'visits' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.contact?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'COMPLETED' ? 'bg-success-100 text-success-700' :
                              item.status === 'SCHEDULED' ? 'bg-primary-100 text-primary-700' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{item.purpose || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.fieldRep?.name}</td>
                        </>
                      )}
                      {activeTab === 'orders' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.orderNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(item.orderDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.contact?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₹{Number(item.totalAmount).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'DELIVERED' ? 'bg-success-100 text-success-700' :
                              item.status === 'APPROVED' ? 'bg-primary-100 text-primary-700' :
                              item.status === 'PENDING' ? 'bg-warn-100 text-warn-700' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.paymentStatus === 'PAID' ? 'bg-success-100 text-success-700' :
                              item.paymentStatus === 'PARTIAL' ? 'bg-warn-100 text-warn-700' :
                              'bg-danger-100 text-danger-700'
                            }`}>
                              {item.paymentStatus}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'payments' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(item.paymentDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.contact?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₹{Number(item.amount).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                              {item.paymentMode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.referenceNumber || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-600">
              <p className="text-lg font-medium">No data found</p>
              <p className="mt-1 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </ContentSection>
    </PageContainer>
  );
}
