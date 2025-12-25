import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { 
  IndianRupee, TrendingUp, Wallet, Clock, 
  Download, Filter, CheckCircle, XCircle,
  DollarSign, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/errorHandler';

const PartnerFinancials = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, payouts
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'payouts') {
      fetchPayoutRequests();
    }
  }, [activeTab, transactionFilter, page]);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      if (!token) {
        toast.error('Please login to access financials');
        navigate('/');
        return;
      }

      const res = await axios.get(`${API}/partner/financials/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      toast.error(getErrorMessage(error, 'Failed to load financial data'));
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const filterParam = transactionFilter === 'all' ? '' : `&transaction_type=${transactionFilter}`;
      const res = await axios.get(`${API}/partner/financials/transactions?page=${page}&limit=20${filterParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const res = await axios.get(`${API}/partner/financials/payout-requests?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayoutRequests(res.data.requests || []);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      toast.error('Failed to load payout requests');
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(payoutAmount) < 500) {
      toast.error('Minimum payout amount is ₹500');
      return;
    }

    if (parseFloat(payoutAmount) > summary?.available_balance_inr) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const token = localStorage.getItem('yuno_token');
      await axios.post(`${API}/partner/financials/payout-request`, {
        amount_inr: parseFloat(payoutAmount),
        notes: payoutNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payout request submitted successfully!');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutNotes('');
      fetchFinancialData();
      if (activeTab === 'payouts') {
        fetchPayoutRequests();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(getErrorMessage(error, 'Failed to submit payout request'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      attended: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financials & Payouts</h1>
          <p className="text-gray-600">Manage your earnings and request payouts</p>
        </div>

        {/* Financial Summary Cards */}
        {activeTab === 'overview' && summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Available Balance */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-1">Available Balance</h3>
              <p className="text-3xl font-bold mb-2">₹{(summary?.available_balance_inr || 0).toLocaleString()}</p>
              <button 
                onClick={() => setShowPayoutModal(true)}
                className="w-full bg-white text-teal-600 hover:bg-gray-100 mt-2"
                disabled={(summary?.available_balance_inr || 0) < 500}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Request Payout
              </button>
            </div>

            {/* Total Earnings */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <IndianRupee className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
              <p className="text-3xl font-bold text-gray-900">₹{(summary?.total_earnings_inr || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">After {summary?.commission_rate || 0}% commission</p>
            </div>

            {/* Pending Payouts */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Payouts</h3>
              <p className="text-3xl font-bold text-gray-900">₹{(summary?.pending_payout_inr || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Under processing</p>
            </div>

            {/* Lifetime Paid Out */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Lifetime Paid</h3>
              <p className="text-3xl font-bold text-gray-900">₹{(summary?.lifetime_earnings_inr || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">From {summary?.total_bookings || 0} bookings</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => { setActiveTab('overview'); setPage(1); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => { setActiveTab('transactions'); setPage(1); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Transactions
              </button>
              <button
                onClick={() => { setActiveTab('payouts'); setPage(1); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payouts'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 inline mr-2" />
                Payout History
              </button>
            </nav>
          </div>

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <select
                  value={transactionFilter}
                  onChange={(e) => { setTransactionFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="booking">Bookings</option>
                  <option value="payout">Payouts</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(txn.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              txn.type === 'booking' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {txn.type === 'booking' ? 'Booking' : 'Payout'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {txn.type === 'booking' ? (
                              <div>
                                <p className="font-medium">{txn.listing_title}</p>
                                <p className="text-gray-500 text-xs">{txn.child_name}</p>
                              </div>
                            ) : (
                              <p>{txn.notes || 'Payout transfer'}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {txn.type === 'booking' ? (
                              <div>
                                <p className="text-green-600">+₹{txn.net_amount_inr}</p>
                                <p className="text-xs text-gray-500">
                                  (₹{txn.commission_inr} commission)
                                </p>
                              </div>
                            ) : (
                              <p className="text-blue-600">-₹{txn.amount_inr}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payout History Tab */}
          {activeTab === 'payouts' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payout Requests</h3>
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No payout requests yet
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payout.requested_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{(payout?.amount_inr || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payout.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {payout.reference_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.processed_at ? formatDate(payout.processed_at) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Earnings Breakdown - Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Gross Revenue</span>
                <span className="font-semibold text-lg">₹{(summary?.gross_revenue_inr || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Platform Commission ({summary?.commission_rate || 0}%)</span>
                <span className="font-semibold text-lg text-red-600">-₹{(summary?.commission_paid_inr || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Net Earnings</span>
                <span className="font-semibold text-lg text-green-600">₹{(summary?.total_earnings_inr || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Pending Payouts</span>
                <span className="font-semibold text-lg text-yellow-600">-₹{(summary?.pending_payout_inr || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-900 font-medium">Available to Withdraw</span>
                <span className="font-bold text-2xl text-teal-600">₹{(summary?.available_balance_inr || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Request Payout</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min="500"
                max={summary?.available_balance_inr || 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: ₹{summary?.available_balance_inr?.toLocaleString() || 0} | Minimum: ₹500
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Add any notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setPayoutAmount('');
                  setPayoutNotes('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Submit Request
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PartnerFinancials;
