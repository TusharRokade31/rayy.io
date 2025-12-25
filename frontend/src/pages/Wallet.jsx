import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { Wallet as WalletIcon, TrendingUp, Gift, Users, Clock, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_BACKEND_URL || '';

const getErrorMessage = (error, defaultMsg) => {
  return error.response?.data?.detail || error.message || defaultMsg;
};

const Wallet = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchWalletData();
    fetchPackages();
    fetchReferralData();
  }, [user, navigate]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletData(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error(getErrorMessage(error, 'Failed to load wallet'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/api/credit-packages`);
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      const response = await axios.get(`${API}/api/referral/my-code`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralData(response.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'earn' || type === 'purchase') return <ArrowUpRight className="text-green-500" size={20} />;
    if (type === 'spend') return <ArrowDownRight className="text-red-500" size={20} />;
    return <Clock className="text-gray-500" size={20} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const wallet = walletData?.wallet || {};
  const transactions = walletData?.transactions || [];
  const expiringSoon = walletData?.expiring_soon || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            rayy Credits
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
            One wallet, unlimited learning
          </p>
        </div>

        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <WalletIcon size={32} />
              <span className="text-xl font-semibold">Available Balance</span>
            </div>
            <button
              onClick={() => setShowBuyModal(true)}
              className="bg-white text-cyan-600 px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <Plus size={20} />
              Buy Credits
            </button>
          </div>
          
          <div className="mb-4">
            <div className="text-6xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {wallet.balance || 0}
            </div>
            <div className="text-xl opacity-90">Credits (₹{wallet.balance || 0})</div>
          </div>

          <div className="flex gap-8 text-sm opacity-90">
            <div>
              <div className="mb-1">Lifetime Earned</div>
              <div className="text-xl font-semibold">{wallet.lifetime_earned || 0}</div>
            </div>
            <div>
              <div className="mb-1">Lifetime Spent</div>
              <div className="text-xl font-semibold">{wallet.lifetime_spent || 0}</div>
            </div>
            <div>
              <div className="mb-1">Tier</div>
              <div className="text-xl font-semibold capitalize">{wallet.tier || 'Silver'}</div>
            </div>
          </div>

          {/* Expiry Warning */}
          {expiringSoon.amount > 0 && (
            <div className="mt-6 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={20} />
                <span className="font-semibold">Expiring Soon</span>
              </div>
              <div className="text-sm">
                {expiringSoon.amount} credits expire in {expiringSoon.days_left} days
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Referral Card */}
          {referralData && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invite Friends</h3>
                  <p className="text-sm text-gray-600">Earn 150 credits per referral</p>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-600 mb-1">Your Referral Code</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 tracking-wider">
                    {referralData.referral_code}
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{referralData.completed_referrals}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{referralData.referral_earnings}</div>
                  <div className="text-xs text-gray-600">Credits Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{referralData.remaining_slots}</div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
          )}

          {/* Earning Opportunities */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Earn More Credits</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900">Review a Class</div>
                  <div className="text-sm text-gray-600">Max 3/month</div>
                </div>
                <div className="text-green-600 font-bold">+50</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900">5 Booking Streak</div>
                  <div className="text-sm text-gray-600">Complete 5 bookings</div>
                </div>
                <div className="text-green-600 font-bold">+200</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900">10+ Classes/Month</div>
                  <div className="text-sm text-gray-600">Loyalty reward</div>
                </div>
                <div className="text-green-600 font-bold">+300</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift size={48} className="mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(txn.transaction_type)}
                    <div>
                      <div className="font-semibold text-gray-900">{txn.description}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(txn.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${txn.transaction_type === 'spend' ? 'text-red-500' : 'text-green-500'}`}>
                    {txn.transaction_type === 'spend' ? '-' : '+'}{txn.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Buy rayy Credits</h2>
                <button onClick={() => setShowBuyModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl ${
                      pkg.popular
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-cyan-500'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{pkg.credits}</div>
                      <div className="text-sm text-gray-600">Credits</div>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-cyan-600">₹{pkg.amount_inr}</div>
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        +{pkg.bonus_percent}% Bonus
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 text-center mb-4">{pkg.description}</p>

                    <button
                      onClick={() => {
                        toast('Payment integration coming soon!');
                      }}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        pkg.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-cyan-600 text-white hover:bg-cyan-700'
                      }`}
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
