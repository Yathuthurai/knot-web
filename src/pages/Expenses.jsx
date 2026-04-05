import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expensesAPI, groupsAPI } from '../services/api';
import { Avatar, Icon, Modal, showToast } from '../components/ui';
import useAuthStore from '../store/authStore';

const fmt = n => parseFloat(n || 0).toFixed(2);

function MemberAvatar({ name, color, size = 36 }) {
  const initials = (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.27, background: color || '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function ExpenseCard({ expense, user, onSettle, onDelete }) {
  const [open, setOpen] = useState(false);
  const isPayer    = expense.paid_by === user?.id;
  const unsettled  = (expense.splits || []).filter(s => !s.is_settled && s.user_id !== expense.paid_by);
  const allSettled = unsettled.length === 0;

  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="list" size={20} color="var(--blue)" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 15 }}>{expense.description}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Paid by <strong>{isPayer ? 'you' : expense.paid_by_user?.display_name}</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>LKR {fmt(expense.total_amount)}</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: allSettled ? '#E8F8ED' : '#FFF0F0', color: allSettled ? '#30D158' : 'var(--danger)' }}>
            {allSettled ? 'Settled' : `${unsettled.length} pending`}
          </span>
        </div>
        <Icon name={open ? 'back' : 'chevron'} size={14} color="var(--text-4)" />
      </div>

      {open && (
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '10px 16px 14px' }}>
          {(expense.splits || []).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <MemberAvatar name={s.user?.display_name} color={s.user?.avatar_color} size={30} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                {s.user_id === user?.id ? 'You' : s.user?.display_name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, marginRight: 10 }}>LKR {fmt(s.amount_owed)}</span>
              {s.is_settled ? (
                <span style={{ fontSize: 11, color: '#30D158', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={13} color="#30D158" /> Settled
                </span>
              ) : s.user_id === expense.paid_by ? (
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Paid</span>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => onSettle(s.id, s.user_id === user?.id ? 'your' : s.user?.display_name + "'s")}>
                  Settle
                </button>
              )}
            </div>
          ))}
          {expense.created_by === user?.id && (
            <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={() => onDelete(expense.id, expense.description)}>
              <Icon name="trash" size={13} color="var(--danger)" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddExpenseModal({ open, onClose, groupId, members, userId, onAdded }) {
  const [description, setDescription]     = useState('');
  const [amount, setAmount]               = useState('');
  const [paidBy, setPaidBy]               = useState(userId);
  const [splitType, setSplitType]         = useState('equal');
  const [selected, setSelected]           = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(members.map(m => m.user?.id || m.user_id));
      setPaidBy(userId);
      setDescription(''); setAmount(''); setSplitType('equal'); setCustomAmounts({});
    }
  }, [open, members, userId]);

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const equalShare = selected.length > 0 && amount ? (parseFloat(amount) / selected.length).toFixed(2) : '0.00';

  const submit = async () => {
    if (!description.trim()) return showToast('Enter a description', 'error');
    if (!amount || isNaN(parseFloat(amount))) return showToast('Enter a valid amount', 'error');
    if (selected.length === 0) return showToast('Select at least one person', 'error');

    let splits;
    if (splitType === 'equal') {
      const share = parseFloat(amount) / selected.length;
      splits = selected.map(uid => ({ userId: uid, amount: share }));
    } else {
      splits = selected.map(uid => ({ userId: uid, amount: parseFloat(customAmounts[uid] || 0) }));
      const total = splits.reduce((s, x) => s + x.amount, 0);
      if (Math.abs(total - parseFloat(amount)) > 0.02) {
        return showToast(`Custom amounts (${total.toFixed(2)}) must equal total (${parseFloat(amount).toFixed(2)})`, 'error');
      }
    }

    setLoading(true);
    try {
      await expensesAPI.create({ groupId, description: description.trim(), totalAmount: parseFloat(amount), paidBy, splits });
      showToast('Expense added!', 'success');
      onClose(); onAdded();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const labelStyle  = { fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 16, display: 'block' };
  const memberGroup = { background: 'var(--bg)', borderRadius: 12, overflow: 'hidden' };
  const memberRow   = (active) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: active ? 'var(--blue-light)' : 'transparent', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' });

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <div className="input-group">
        <label className="input-label">Description</label>
        <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Dinner, Taxi, Groceries" autoFocus />
      </div>

      <div className="input-group">
        <label className="input-label">Total Amount (LKR)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>LKR</span>
          <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" style={{ fontSize: 22, fontWeight: 700 }} />
        </div>
      </div>

      <label style={labelStyle}>Paid by</label>
      <div style={memberGroup}>
        {members.map((m, i) => {
          const uid  = m.user?.id || m.user_id;
          const name = m.user?.display_name || 'Unknown';
          const active = paidBy === uid;
          return (
            <div key={uid} onClick={() => setPaidBy(uid)} style={{ ...memberRow(active), borderBottom: i < members.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <MemberAvatar name={name} color={m.user?.avatar_color} size={34} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 600 : 400, color: active ? 'var(--blue-dark)' : 'var(--text)' }}>
                {name}{uid === userId ? ' (you)' : ''}
              </span>
              {active && <Icon name="check" size={16} color="var(--blue)" />}
            </div>
          );
        })}
      </div>

      <label style={labelStyle}>Split between</label>
      <div style={memberGroup}>
        {members.map((m, i) => {
          const uid  = m.user?.id || m.user_id;
          const name = m.user?.display_name || 'Unknown';
          const active = selected.includes(uid);
          return (
            <div key={uid} onClick={() => toggle(uid)} style={{ ...memberRow(active), borderBottom: i < members.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <MemberAvatar name={name} color={m.user?.avatar_color} size={34} />
              <span style={{ flex: 1, fontSize: 14, color: active ? 'var(--blue-dark)' : 'var(--text)', fontWeight: active ? 600 : 400 }}>
                {name}{uid === userId ? ' (you)' : ''}
              </span>
              <div style={{ width: 20, height: 20, borderRadius: 10, background: active ? 'var(--blue)' : 'transparent', border: active ? 'none' : '1.5px solid var(--text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && <Icon name="check" size={12} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>

      <label style={labelStyle}>Split type</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        {[{ v: 'equal', l: 'Equal split' }, { v: 'custom', l: 'Custom amounts' }].map(o => (
          <button key={o.v} onClick={() => setSplitType(o.v)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1.5px solid ${splitType === o.v ? 'var(--blue)' : 'var(--border)'}`, background: splitType === o.v ? 'var(--blue-light)' : 'var(--card)', color: splitType === o.v ? 'var(--blue-dark)' : 'var(--text-3)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            {o.l}
          </button>
        ))}
      </div>

      {splitType === 'equal' && amount && selected.length > 0 && (
        <div style={{ background: 'var(--blue-light)', borderRadius: 10, padding: '10px 14px', margin: '10px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--blue-dark)' }}>
            Each person pays <strong>LKR {equalShare}</strong> ({selected.length} {selected.length === 1 ? 'person' : 'people'})
          </span>
        </div>
      )}

      {splitType === 'custom' && (
        <div style={{ ...memberGroup, margin: '10px 0' }}>
          {selected.map((uid, i) => {
            const m    = members.find(m => (m.user?.id || m.user_id) === uid);
            const name = m?.user?.display_name || 'Unknown';
            return (
              <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < selected.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <MemberAvatar name={name} color={m?.user?.avatar_color} size={30} />
                <span style={{ flex: 1, fontSize: 13 }}>{uid === userId ? 'You' : name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>LKR</span>
                  <input type="number" value={customAmounts[uid] || ''} onChange={e => setCustomAmounts(p => ({ ...p, [uid]: e.target.value }))}
                    placeholder="0.00" step="0.01"
                    style={{ width: 90, fontSize: 15, fontWeight: 600, textAlign: 'right', padding: '4px 0', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--blue-border)', outline: 'none', fontFamily: 'var(--font)', color: 'var(--text)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Adding...' : 'Add Expense'}
      </button>
    </Modal>
  );
}

export default function ExpensesPage() {
  const { groupId }   = useParams();
  const navigate      = useNavigate();
  const user          = useAuthStore(s => s.user);
  const [expenses, setExpenses]   = useState([]);
  const [balances, setBalances]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('expenses');
  const [showAdd, setShowAdd]     = useState(false);
  const [groupName, setGroupName] = useState('');

  const load = useCallback(async () => {
    try {
      const [eR, gR] = await Promise.all([expensesAPI.forGroup(groupId), groupsAPI.get(groupId)]);
      setExpenses(eR.data.expenses || []);
      setBalances(eR.data.balances || []);
      setMembers(gR.data.group?.members || []);
      setGroupName(gR.data.group?.name || '');
    } catch { navigate(-1); }
    finally { setLoading(false); }
  }, [groupId, navigate]);

  useEffect(() => { load(); }, [load]);

  const settle = async (splitId, label) => {
    if (!window.confirm(`Mark ${label} share as settled?`)) return;
    try { await expensesAPI.settle(splitId); load(); showToast('Settled!', 'success'); }
    catch { showToast('Failed', 'error'); }
  };

  const deleteExpense = async (id, desc) => {
    if (!window.confirm(`Delete "${desc}"? Cannot be undone.`)) return;
    try { await expensesAPI.delete(id); load(); showToast('Deleted', ''); }
    catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const myBalances = balances.filter(b => b.ower_id === user?.id || b.payer_id === user?.id);
  const totalOwed  = myBalances.filter(b => b.ower_id === user?.id).reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalOwing = myBalances.filter(b => b.payer_id === user?.id).reduce((s, b) => s + parseFloat(b.amount), 0);

  return (
    <div>
      <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14 }}>
          <Icon name="back" size={16} color="var(--blue)" /> Back
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Expenses · {groupName}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} color="#fff" /> Add
        </button>
      </div>

      {myBalances.length > 0 && (
        <div style={{ background: 'var(--card)', borderBottom: '0.5px solid var(--border)', padding: '12px 20px', display: 'flex', gap: 12 }}>
          {totalOwed > 0 && (
            <div style={{ flex: 1, background: '#FFF0F0', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>You owe</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>LKR {fmt(totalOwed)}</p>
            </div>
          )}
          {totalOwing > 0 && (
            <div style={{ flex: 1, background: '#E8F8ED', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: '#30D158', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Owed to you</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#30D158' }}>LKR {fmt(totalOwing)}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '12px 20px', background: 'var(--card)', borderBottom: '0.5px solid var(--border)' }}>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
            Expenses {expenses.length > 0 ? `(${expenses.length})` : ''}
          </button>
          <button className={`tab-btn ${tab === 'balances' ? 'active' : ''}`} onClick={() => setTab('balances')}>
            Balances {balances.length > 0 ? `(${balances.length})` : ''}
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading...</div>
        ) : tab === 'expenses' ? (
          expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <p className="empty-title">No expenses yet</p>
              <p className="empty-sub">Add an expense and split it with the group</p>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add First Expense</button>
            </div>
          ) : expenses.map(e => (
            <ExpenseCard key={e.id} expense={e} user={user} onSettle={settle} onDelete={deleteExpense} />
          ))
        ) : balances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p className="empty-title">All settled up!</p>
            <p className="empty-sub">No outstanding balances in this group</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {balances.map((b, i) => {
              const isMyDebt   = b.ower_id === user?.id;
              const isMyCredit = b.payer_id === user?.id;
              return (
                <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MemberAvatar name={b.ower_name} color={b.ower_color} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14 }}>
                      <strong>{isMyDebt ? 'You' : b.ower_name}</strong>
                      <span style={{ color: 'var(--text-3)' }}> owe{isMyDebt ? '' : 's'} </span>
                      <strong>{isMyCredit ? 'you' : b.payer_name}</strong>
                    </p>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: isMyDebt ? 'var(--danger)' : isMyCredit ? '#30D158' : 'var(--text-3)' }}>
                    LKR {fmt(b.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddExpenseModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        groupId={groupId}
        members={members}
        userId={user?.id}
        onAdded={load}
      />
    </div>
  );
}