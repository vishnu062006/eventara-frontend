'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { fireConfetti } from '@/lib/confetti';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet, 
  Receipt, X, ShieldCheck, Activity, Plus, CreditCard, 
  ArrowDownToLine, CheckCircle2, SlidersHorizontal
} from 'lucide-react';

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

type FilterType = 'ALL' | 'TOP_UPS' | 'DEBITS' | 'REFUNDS';

// --- Helper to Group Transactions ---
const groupTransactions = (transactions: Transaction[]) => {
  const groups: { [key: string]: Transaction[] } = {
    'Today': [],
    'Yesterday': [],
    'Earlier this week': [],
    'Older': []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  transactions.forEach(tx => {
    const txDate = new Date(tx.createdAt);
    if (txDate >= today) groups['Today'].push(tx);
    else if (txDate >= yesterday) groups['Yesterday'].push(tx);
    else if (txDate >= thisWeek) groups['Earlier this week'].push(tx);
    else groups['Older'].push(tx);
  });

  return groups;
};

// --- Next-Gen Hover Card (from Dashboard) ---
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 400, damping: 40 });
  const glareX = useTransform(x, [-0.5, 0.5], ['-20%', '120%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['-20%', '120%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200 }}
      className={`relative group rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:bg-white/[0.04] ${className}`}
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([gx, gy]) => `radial-gradient(circle 300px at ${gx} ${gy}, rgba(255,255,255,0.12), transparent)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

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

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

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
      setTransactions(txRes.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      toast.error('Failed to load wallet data.');
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

    try {
      await api.post(`/api/wallet/${user!.id}/topup`, { amount: finalAmount });
      fireConfetti();
      toast.success(`₹${finalAmount} added to your wallet!`);
      setShowAddMoney(false);
      setSelectedAmount(null);
      setCustomAmount('');
      fetchWalletData();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Top-up failed. Please try again.');
    }

    setPaying(false);
  };

  // --- Filtering Logic ---
  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'ALL') return true;
    
    const isCredit = tx.type === 'CREDIT';
    const isRefund = isCredit && tx.description.toLowerCase().includes('refund');
    
    if (activeFilter === 'REFUNDS') return isRefund;
    if (activeFilter === 'TOP_UPS') return isCredit && !isRefund;
    if (activeFilter === 'DEBITS') return !isCredit;
    
    return true;
  });

  const groupedTransactions = groupTransactions(filteredTransactions);

  return (
    <div className="min-h-screen bg-[#030305] text-slate-200 font-sans px-6 pt-24 pb-20 selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* --- Deep Space Ambient Gradients --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto w-full relative z-10 flex-1">
        
        {/* --- BACK BUTTON --- */}
        <motion.button
          onClick={() => router.back()}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-4 py-2 mb-8 text-sm font-bold tracking-wide transition-colors border rounded-xl bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 backdrop-blur-md"
        >
          <ArrowLeft size={16} /> Dashboard
        </motion.button>

        {/* --- HEADER --- */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Digital Wallet</h1>
          <p className="mt-2 font-medium text-slate-400 text-sm md:text-base">
            Manage your balance, top-ups, and track transaction history.
          </p>
        </motion.div>

        {/* --- BALANCE CARD (GLASSMORPHISM) --- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-8 md:p-10">
            {/* Inner Glows Specific to Card */}
            <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-violet-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">
                  <Wallet size={14} className="text-cyan-400" /> Available Balance
                </div>
                <div className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none drop-shadow-sm">
                  {loading ? (
                    <div className="h-16 w-48 bg-white/5 rounded-xl animate-pulse" />
                  ) : isAdmin ? (
                    '∞'
                  ) : (
                    <>
                      <span className="text-slate-500 font-medium mr-1">₹</span>
                      {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </>
                  )}
                </div>
                
                {isAdmin ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-5 text-xs font-bold uppercase tracking-wider text-violet-400 border border-violet-500/20 rounded-md bg-violet-500/10 backdrop-blur-md">
                    <ShieldCheck size={14} /> Admin Privileges Active
                  </div>
                ) : (
                  <div className="mt-4 text-sm font-medium text-slate-400 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400/70" /> Updated instantly after transactions
                  </div>
                )}
              </div>

              {!isAdmin && (
                <button 
                  onClick={() => setShowAddMoney(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold text-black transition-all rounded-xl bg-white hover:bg-cyan-400 active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] shrink-0"
                >
                  <Plus size={18} strokeWidth={2.5} /> Add Money
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* --- QUICK STATS --- */}
        {!loading && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12"
          >
            {[
              { 
                value: `₹${transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString('en-IN')}`, 
                label: 'Total Credited', 
                icon: ArrowDownToLine,
                color: 'text-violet-400'
              },
              { 
                value: `₹${transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString('en-IN')}`, 
                label: 'Total Spent', 
                icon: CreditCard,
                color: 'text-rose-400'
              },
              { 
                value: `${transactions.length}`, 
                label: 'Transactions', 
                icon: Activity,
                color: 'text-cyan-400'
              },
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div className="text-2xl font-bold tracking-tight text-white">{stat.value}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* --- TRANSACTION HISTORY & FILTERS --- */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-cyan-400" />
              <h2 className="text-xl font-bold tracking-tight text-white">Transaction History</h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TOP_UPS', label: 'Top-ups' },
                { id: 'DEBITS', label: 'Payments' },
                { id: 'REFUNDS', label: 'Refunds' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FilterType)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap border ${
                    activeFilter === filter.id
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                      : 'bg-white/[0.02] text-slate-400 border-white/[0.05] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-[20px] bg-white/[0.02] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-[32px] bg-white/[0.01]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <SlidersHorizontal size={24} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white">No transactions found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">
                {activeFilter === 'ALL' 
                  ? "Top up your wallet or register for an event to see activity here."
                  : `No ${activeFilter.toLowerCase().replace('_', ' ')} match your filter criteria.`}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedTransactions).map(([group, txs]) => {
                if (txs.length === 0) return null;
                return (
                  <div key={group}>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 px-1">{group}</h3>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {txs.map((tx) => {
                          const isCredit = tx.type === 'CREDIT';
                          const isRefund = isCredit && tx.description.toLowerCase().includes('refund');
                          
                          // Themed Visual Semantics
                          const iconBg = isRefund ? 'bg-emerald-500/10' : isCredit ? 'bg-violet-500/10' : 'bg-rose-500/10';
                          const iconColor = isRefund ? 'text-emerald-400' : isCredit ? 'text-violet-400' : 'text-rose-400';
                          const amountColor = isRefund ? 'text-emerald-400' : isCredit ? 'text-white' : 'text-white';
                          const sign = isCredit ? '+' : '-';
                          const badgeText = isRefund ? 'Refund' : isCredit ? 'Top-up' : 'Payment';

                          return (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              key={tx.id}
                              className="group flex items-center justify-between p-5 transition-all border rounded-[20px] bg-white/[0.02] border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04]"
                            >
                              <div className="flex items-center gap-5">
                                <div className={`flex items-center justify-center shrink-0 w-12 h-12 rounded-full ${iconBg} ${iconColor} border border-white/5 transition-transform group-hover:scale-110`}>
                                  {isCredit ? <ArrowDownToLine size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">{tx.description}</span>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-xs font-medium text-slate-500">
                                      {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${iconColor}`}>{badgeText}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-black tracking-tight ${amountColor}`}>
                                  {sign}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="mt-1 text-xs font-medium text-slate-500">
                                  Bal: ₹{tx.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* --- ADD MONEY MODAL --- */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md overflow-hidden border rounded-[2rem] bg-[#0a0a0f] border-white/10 shadow-2xl relative"
            >
              {/* Modal Ambient Gradients */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between p-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Top Up Wallet</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-cyan-400" /> Secure transaction via Razorpay
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddMoney(false)}
                  className="p-2 transition-colors rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative z-10 p-6 pt-5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 block">Quick Select</label>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3 text-sm font-bold transition-all border rounded-xl ${
                        selectedAmount === amt 
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                        : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 block">Custom Amount</label>
                <div className="relative mb-8">
                  <span className="absolute text-lg font-bold -translate-y-1/2 text-slate-500 left-5 top-1/2">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    min={10} max={50000}
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full py-4 pl-12 pr-4 text-lg font-bold transition-colors border rounded-xl bg-white/[0.02] border-white/5 text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.05] outline-none shadow-inner"
                  />
                </div>

                {finalAmount && finalAmount >= 10 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 mb-6 border rounded-xl bg-cyan-500/5 border-cyan-500/20"
                  >
                    <span className="text-sm font-medium text-slate-400">Resulting balance</span>
                    <span className="font-bold text-cyan-400">₹{(balance + finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </motion.div>
                ) : <div className="h-[74px] mb-6" /> /* Layout placeholder */}

                <button
                  onClick={handleAddMoney}
                  disabled={paying || !finalAmount || finalAmount < 10}
                  className="w-full py-4 text-sm font-extrabold text-black transition-all rounded-xl bg-white disabled:opacity-50 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed hover:not-disabled:bg-cyan-400 hover:not-disabled:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:not-disabled:scale-[0.98]"
                >
                  {paying 
                    ? 'Processing securely...' 
                    : finalAmount && finalAmount >= 10 
                    ? `Add ₹${finalAmount.toLocaleString('en-IN')}` 
                    : 'Select Amount'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}