import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API } from '../../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  Gift, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  History,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import MobileLayout from '../../layouts/MobileLayout';

const MobileWallet = () => {
  const { user, showAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
      fetchPackages();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Extract wallet object from response
      const walletObj = response.data.wallet || response.data;
      setWalletData({
        balance: walletObj.balance || walletObj.credits_balance || 0,
        total_earned: walletObj.lifetime_earned || 0,
        total_spent: walletObj.lifetime_spent || 0,
        ...walletObj
      });
      // Set transactions from response if available
      if (response.data.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    // Only fetch if not already loaded from wallet endpoint
    if (transactions.length === 0) {
      try {
        const token = localStorage.getItem('yuno_token');
        const response = await axios.get(`${API}/wallet/transactions?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data.transactions || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/credit-packages`);
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <MobileLayout hideBottomNav>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 pt-12 pb-24 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
              >
                <ArrowDownRight className="w-5 h-5 text-white rotate-90" />
              </button>
              
              <h1 className="text-white font-bold text-3xl mb-2">Wallet</h1>
              <p className="text-white/80 text-sm">Manage your credits & transactions</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="flex-1 -mt-16 px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">Sign in to access your wallet and manage credits</p>
              <button
                onClick={() => showAuthModal('customer')}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Login / Sign Up
              </button>
            </motion.div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const handleBuyPackage = (pkg) => {
    toast.info('Payment integration coming soon!');
  };

  if (loading) {
    return (
      <MobileLayout hideBottomNav>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 pt-12 pb-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <ArrowDownRight className="w-5 h-5 text-white rotate-90" />
            </button>
            
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <WalletIcon size={20} />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-white">₹</span>
              <span className="text-5xl font-bold text-white">{walletData?.balance?.toFixed(2) || '0.00'}</span>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBuyPackage}
                className="flex-1 bg-white text-green-600 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add Money
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const historySection = document.getElementById('transaction-history');
                  if (historySection) {
                    historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <History size={20} />
                History
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 -mt-16 pb-24 space-y-6 relative z-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowDownRight size={16} />
                </div>
                <span className="text-xs font-medium text-gray-600">Earned</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{walletData?.total_earned?.toFixed(0) || '0'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
                <span className="text-xs font-medium text-gray-600">Spent</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{walletData?.total_spent?.toFixed(0) || '0'}
              </div>
            </motion.div>
          </div>

          {/* Credit Packages */}
          {packages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Credit Packages</h3>
              </div>
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl p-5 shadow-lg border-2 border-green-100"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CreditCard size={20} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-gray-900 block text-base">{pkg.name}</span>
                            {pkg.bonus > 0 && (
                              <span className="text-xs text-green-600 font-semibold">
                                +₹{pkg.bonus} Bonus
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-green-600">₹</span>
                          <span className="text-2xl font-bold text-green-600">{pkg.amount}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBuyPackage(pkg)}
                        className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                      >
                        Buy
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div id="transaction-history">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                </div>
                <span className="text-sm text-gray-500 font-semibold">
                  Last 5 transactions
                </span>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((txn, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-4 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {txn.type === 'credit' ? (
                            <ArrowDownRight size={20} className="text-green-600" />
                          ) : (
                            <ArrowUpRight size={20} className="text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{txn.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(txn.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold text-lg ml-2 ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {transactions.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 text-center shadow-lg"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600 text-sm mb-4">
                Add money to your wallet to get started
              </p>
              <button
                onClick={handleBuyPackage}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg"
              >
                Add Money
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileWallet;
