'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { fireConfetti } from '@/lib/confetti';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet, Receipt, X, ShieldCheck } from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  balanceAfter: number;
  createdAt: string;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
const ADMIN_EMAIL = 'vmh@gmail.com';

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!user?.id) return;
    fetchWalletData();
  }, [user?.id]);

  const fetchWalletData = async () => {
    if (!user?.id) return;
    try {
      const [balRes, txRes] = await Promise.all([
        api.get(`/api/wallet/${user.id}/balance`),
        api.get(`/api/wallet/${user.id}/transactions`),
      ]);
      setBalance(balRes.data.balance);
      setTransactions(txRes.data);
    } catch {
      toast.error('Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);

  const handleAddMoney = async () => {
    if (!finalAmount || finalAmount < 10) {
      toast.error('Minimum amount is ₹10.');
      return;
    }
    if (finalAmount > 50000) {
      toast.error('Maximum top-up is ₹50,000.');
      return;
    }

    setPaying(true);

    // ── MOCK payment (remove when Razorpay keys added) ────────────
    try {
      await api.post(`/api/wallet/${user!.id}/topup`, { amount: finalAmount });
      fireConfetti();
      toast.success(`₹${finalAmount} added to your wallet! 🎉`);
      setShowAddMoney(false);
      setSelectedAmount(null);
      setCustomAmount('');
      fetchWalletData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Top-up failed.');
    }
    // ──────────────────────────────────────────────────────────────

    setPaying(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans px-6 pt-20 pb-16 text-[var(--text)]">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium transition-colors border rounded-lg bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] hover:border-blue-500/30"
        >
          <ArrowLeft size={16} /> Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Wallet</h1>
          <p className="mt-1 font-light text-[var(--muted)] text-sm md:text-base">Manage your balance and transaction history</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden border rounded-3xl bg-[var(--surface)] border-[var(--border)] p-7 md:p-8 mb-8"
        >
          {/* Decorative Glow */}
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end md:gap-4">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-[var(--muted)] mb-2">Available Balance</div>
              <div className="text-5xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#58a6ff] to-[#a78bfa] leading-none">
                {loading ? '—' : isAdmin ? '∞' : `₹${balance.toFixed(2)}`}
              </div>
              
              {isAdmin ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-purple-400 border border-blue-500/20 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  ⚡ Admin · Unlimited Access
                </div>
              ) : (
                <div className="mt-3 text-xs font-light text-[var(--muted)]">Used for registrations · Refunds credited here</div>
              )}
            </div>

            {!isAdmin && (
              <button 
                onClick={() => setShowAddMoney(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-gray-950 transition-all rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a78bfa] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(88,166,255,0.3)] shadow-[0_4px_16px_rgba(88,166,255,0.2)]"
              >
                <Wallet size={18} /> Add Money
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        {!loading && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3 md:gap-4 mb-8"
          >
            {[
              { value: `₹${transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(0)}`, label: 'Total Credited', color: 'text-green-500' },
              { value: `₹${transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(0)}`, label: 'Total Spent', color: 'text-red-500' },
              { value: `${transactions.length}`, label: 'Transactions', color: 'text-blue-500' },
            ].map(({ value, label, color }) => (
              <div key={label} className="p-4 text-center border rounded-2xl bg-[var(--surface)] border-[var(--border)]">
                <div className={`text-lg md:text-xl font-extrabold tracking-tight ${color}`}>{value}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="text-xs font-bold tracking-widest uppercase text-[var(--muted)] mb-4">Transaction History</div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface)] animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted)]">
              <Receipt size={40} className="mx-auto mb-3 opacity-40" />
              <div className="text-sm font-light">No transactions yet.<br />Register for an event to get started.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-4 transition-colors border rounded-xl bg-[var(--surface)] border-[var(--border)] hover:border-blue-500/20 hover:bg-[var(--surface2)]"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-xl ${tx.type === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'CREDIT' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate text-[var(--text)]">{tx.description}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className={`text-sm font-extrabold tracking-tight ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">₹{tx.balanceAfter.toFixed(2)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddMoney(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden border rounded-3xl bg-[var(--surface)] border-[var(--border)] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-6 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Add Money</h2>
                  <p className="mt-1 text-sm font-light text-[var(--muted)] flex items-center gap-1">
                    <ShieldCheck size={14} className="text-blue-400" /> Secure payment via Razorpay
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddMoney(false)}
                  className="flex items-center justify-center w-8 h-8 transition-colors border rounded-lg bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="text-xs font-bold tracking-widest uppercase text-[var(--muted)] mb-3">Select Amount</div>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3 text-sm font-bold transition-all border rounded-xl ${
                        selectedAmount === amt 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                        : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:border-blue-500/40 hover:text-[var(--text)]'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-bold tracking-widest uppercase text-[var(--muted)] mb-3">Or enter custom amount</div>
                <div className="relative mb-6">
                  <span className="absolute text-sm font-bold -translate-y-1/2 text-[var(--muted)] left-4 top-1/2">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    min={10}
                    max={50000}
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full py-3 pl-8 pr-4 text-sm font-bold transition-colors border rounded-xl bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Live Preview */}
                {finalAmount && finalAmount >= 10 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 mb-6 border rounded-xl bg-blue-500/5 border-blue-500/20"
                  >
                    <span className="text-sm text-[var(--muted)]">New balance after top-up</span>
                    <span className="font-extrabold text-blue-500">₹{(balance + finalAmount).toFixed(2)}</span>
                  </motion.div>
                )}

                <button
                  onClick={handleAddMoney}
                  disabled={paying || !finalAmount || finalAmount < 10}
                  className="w-full py-4 text-sm font-extrabold text-gray-950 transition-all rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a78bfa] disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_8px_24px_rgba(88,166,255,0.3)] shadow-[0_4px_16px_rgba(88,166,255,0.2)]"
                >
                  {paying 
                    ? 'Processing...' 
                    : finalAmount && finalAmount >= 10 
                    ? `Add ₹${finalAmount} to Wallet` 
                    : 'Select an Amount'}
                </button>

                <p className="mt-4 text-xs font-light leading-relaxed text-center text-[var(--muted)]">
                  🔒 Payments secured by Razorpay · UPI, Cards, Net Banking supported
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}