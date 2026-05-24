'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { fireConfetti } from '@/lib/confetti';

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

    // TODO: Replace this block with real Razorpay when keys are ready
    // ── Razorpay skeleton ──────────────────────────────────────────
    // Step 1: Create order on backend
    // const orderRes = await api.post('/api/wallet/create-order', { amount: finalAmount, userId: user.id });
    // const { orderId, amount, currency } = orderRes.data;
    //
    // Step 2: Open Razorpay checkout
    // const options = {
    //   key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    //   amount,
    //   currency,
    //   name: 'Eventara',
    //   description: 'Wallet Top-up',
    //   order_id: orderId,
    //   handler: async (response) => {
    //     await api.post('/api/wallet/verify-payment', {
    //       razorpay_order_id: response.razorpay_order_id,
    //       razorpay_payment_id: response.razorpay_payment_id,
    //       razorpay_signature: response.razorpay_signature,
    //       userId: user.id,
    //       amount: finalAmount,
    //     });
    //     toast.success(`₹${finalAmount} added to wallet!`);
    //     fetchWalletData();
    //     setShowAddMoney(false);
    //   },
    //   prefill: { name: user.name, email: user.email },
    //   theme: { color: '#58a6ff' },
    // };
    // const rzp = new (window as any).Razorpay(options);
    // rzp.open();
    // ──────────────────────────────────────────────────────────────

    // ── MOCK payment (remove when Razorpay keys added) ────────────
    try {
      await api.post(`/api/wallet/${user!.id}/topup`, { amount: finalAmount });
      fireConfetti(); // 🔥 ADDED
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        .wallet-wrap {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: var(--bg);
          padding: 80px 24px 60px;
        }
        .wallet-inner { max-width: 680px; margin: 0 auto; }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 32px;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .back-btn:hover {
          color: var(--text);
          border-color: rgba(88,166,255,0.3);
          background: var(--surface2);
        }

        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }
        .page-sub {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 28px;
          font-weight: 300;
        }

        .balance-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .balance-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(88,166,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .balance-card-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .balance-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          font-family: 'Syne', sans-serif;
          margin-bottom: 8px;
        }
        .balance-amount {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .balance-sub {
          font-size: 12px;
          color: var(--muted);
          margin-top: 8px;
          font-weight: 300;
        }
        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(88,166,255,0.12), rgba(167,139,250,0.12));
          border: 1px solid rgba(88,166,255,0.2);
          font-size: 11px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          color: #a78bfa;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .add-money-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          border: none;
          color: #060910;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(88,166,255,0.2);
          white-space: nowrap;
          align-self: flex-end;
        }
        .add-money-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(88,166,255,0.32);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .stat-tile {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          text-align: center;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }
        .stat-label {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
          font-weight: 400;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 12px;
        }

        .tx-list { display: flex; flex-direction: column; gap: 8px; }

        .tx-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: border-color 0.15s, background 0.15s;
          cursor: default;
        }
        .tx-row:hover {
          border-color: rgba(88,166,255,0.15);
          background: var(--surface2);
        }
        .tx-left { display: flex; align-items: center; gap: 12px; }
        .tx-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .tx-desc {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 2px;
          max-width: 260px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tx-date { font-size: 11px; color: var(--muted); }
        .tx-right { text-align: right; flex-shrink: 0; }
        .tx-amount {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .tx-bal { font-size: 11px; color: var(--muted); margin-top: 2px; }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: var(--muted);
        }
        .empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.4;
        }
        .empty-text {
          font-size: 14px;
          font-weight: 300;
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%; max-width: 440px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(88,166,255,0.06);
          overflow: hidden;
        }
        .modal-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }
        .modal-sub { font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 300; }
        .close-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--muted);
          cursor: pointer;
          font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .close-btn:hover { color: var(--text); border-color: var(--muted); }

        .modal-body { padding: 20px 24px; }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .preset-btn {
          padding: 12px 8px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--muted);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .preset-btn:hover {
          border-color: rgba(88,166,255,0.4);
          color: var(--text);
        }
        .preset-btn.selected {
          border-color: #58a6ff;
          background: rgba(88,166,255,0.1);
          color: #58a6ff;
        }

        .custom-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
          font-family: 'Syne', sans-serif;
        }
        .custom-input {
          width: 100%;
          padding: 12px 14px 12px 36px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text);
          font-size: 15px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .custom-input:focus { border-color: #58a6ff; }
        .custom-input-wrap { position: relative; margin-bottom: 20px; }
        .rupee-prefix {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--muted);
          pointer-events: none;
        }

        .pay-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #58a6ff, #a78bfa);
          color: #060910;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(88,166,255,0.25);
          letter-spacing: 0.01em;
        }
        .pay-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(88,166,255,0.35);
        }
        .pay-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .modal-note {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          margin-top: 12px;
          font-weight: 300;
          line-height: 1.5;
        }

        .skeleton {
          background: var(--surface);
          border-radius: 12px;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="wallet-wrap">
        <div className="wallet-inner">

          {/* Back */}
          <motion.button
            className="back-btn"
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ← Back
          </motion.button>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-title">Wallet</h1>
            <p className="page-sub">Manage your balance and transaction history</p>
          </motion.div>

          {/* Balance Card */}
          <motion.div
            className="balance-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="balance-card-inner">
              <div>
                <div className="balance-label">Available Balance</div>
                <div className="balance-amount">
                  {loading ? '—' : isAdmin ? '∞' : `₹${balance.toFixed(2)}`}
                </div>
                {isAdmin ? (
                  <div style={{ marginTop: 10 }}>
                    <span className="admin-badge">⚡ Admin · Unlimited Access</span>
                  </div>
                ) : (
                  <div className="balance-sub">Used for registrations · Refunds credited here</div>
                )}
              </div>
              {!isAdmin && (
                <button className="add-money-btn" onClick={() => setShowAddMoney(true)}>
                  + Add Money
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          {!loading && !isAdmin && (
            <motion.div
              className="stats-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {[
                {
                  value: `₹${transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(0)}`,
                  label: 'Total Credited',
                  color: '#3fb950',
                },
                {
                  value: `₹${transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(0)}`,
                  label: 'Total Spent',
                  color: '#f85149',
                },
                {
                  value: `${transactions.length}`,
                  label: 'Transactions',
                  color: '#58a6ff',
                },
              ].map(({ value, label, color }) => (
                <div className="stat-tile" key={label}>
                  <div className="stat-value" style={{ color }}>{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-title">Transaction History</div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 64 }} />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🧾</div>
                <div className="empty-text">No transactions yet.<br />Register for an event to get started.</div>
              </div>
            ) : (
              <div className="tx-list">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    className="tx-row"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="tx-left">
                      <div
                        className="tx-icon"
                        style={{
                          background: tx.type === 'CREDIT' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                        }}
                      >
                        {tx.type === 'CREDIT' ? '↑' : '↓'}
                      </div>
                      <div>
                        <div className="tx-desc">{tx.description}</div>
                        <div className="tx-date">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          {' · '}
                          {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div
                        className="tx-amount"
                        style={{ color: tx.type === 'CREDIT' ? '#3fb950' : '#f85149' }}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </div>
                      <div className="tx-bal">₹{tx.balanceAfter.toFixed(2)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Add Money Modal ── */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddMoney(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="modal-title">Add Money</div>
                  <div className="modal-sub">Secure payment via Razorpay</div>
                </div>
                <button className="close-btn" onClick={() => setShowAddMoney(false)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Preset amounts */}
                <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'Syne', sans-serif" }}>
                  Select Amount
                </div>
                <div className="presets-grid">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      className={`preset-btn ${selectedAmount === amt ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="custom-label">Or enter custom amount</div>
                <div className="custom-input-wrap">
                  <span className="rupee-prefix">₹</span>
                  <input
                    type="number"
                    className="custom-input"
                    placeholder="0"
                    value={customAmount}
                    min={10}
                    max={50000}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                  />
                </div>

                {/* Summary */}
                {finalAmount && finalAmount >= 10 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(88,166,255,0.06)',
                      border: '1px solid rgba(88,166,255,0.15)',
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>New balance after top-up</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: '#58a6ff' }}>
                      ₹{(balance + finalAmount).toFixed(2)}
                    </span>
                  </motion.div>
                )}

                <button
                  className="pay-btn"
                  onClick={handleAddMoney}
                  disabled={paying || !finalAmount || finalAmount < 10}
                >
                  {paying
                    ? 'Processing...'
                    : finalAmount && finalAmount >= 10
                    ? `Add ₹${finalAmount} to Wallet`
                    : 'Select an Amount'}
                </button>

                <p className="modal-note">
                  🔒 Payments secured by Razorpay · UPI, Cards, Net Banking supported
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}