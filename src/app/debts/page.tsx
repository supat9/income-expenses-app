'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Btn, Modal, Empty } from '@/components/ui';
import { MiniBar } from '@/components/Charts';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { formatTHB } from '@/lib/formatters';

const PALETTE = [
  "oklch(0.65 0.16 35)", "oklch(0.62 0.14 240)", "oklch(0.65 0.16 320)",
  "oklch(0.65 0.13 195)", "oklch(0.55 0.14 280)", "oklch(0.7 0.14 145)",
  "oklch(0.6 0.16 10)", "oklch(0.65 0.15 295)", "oklch(0.6 0.13 158)",
  "oklch(0.65 0.13 175)", "oklch(0.6 0.13 130)", "oklch(0.55 0.18 270)",
];

const ICONS = ["💳", "🏦", "🏠", "🚗", "📚", "💊", "🎓", "🏪", "💼", "📱", "💰", "🪙", "🔧", "🛒", "👔", "💡", "📋", "🎯", "🌐", "🏗️"];

const STYLES = `
  .dt-overall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .dt-sum { display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
  .dt-sum-label { font-size: 11.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }
  .dt-sum-val { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  .dt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .dt-card { display: flex; flex-direction: column; gap: 12px; padding: var(--pad); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); transition: border-color .15s; }
  .dt-card.paid { border-color: color-mix(in oklab, var(--income) 40%, var(--line)); background: linear-gradient(0deg, var(--income-soft), transparent 80%), var(--surface); }
  .dt-head { display: flex; align-items: center; gap: 12px; }
  .dt-ic { width: 40px; height: 40px; border-radius: 10px; font-size: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .dt-name { font-size: 14px; font-weight: 600; }
  .dt-sub { font-size: 12px; color: var(--ink-3); margin-top: 1px; }
  .dt-acts { display: inline-flex; gap: 2px; margin-left: auto; }
  .dt-acts button { width: 28px; height: 28px; border: none; background: transparent; color: var(--ink-3); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
  .dt-acts button:hover { background: var(--surface-2); color: var(--ink); }
  .dt-acts button.del:hover { color: var(--expense); }
  .dt-amts { display: flex; justify-content: space-between; align-items: flex-end; }
  .dt-paid { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  .dt-of { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
  .dt-pct { font-size: 16px; font-weight: 600; color: var(--ink-2); }
  .dt-foot { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--ink-3); gap: 8px; }
  .dt-pay-btn { font-size: 12px; font-weight: 500; color: var(--accent); background: var(--accent-soft); border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .dt-pay-btn:hover { background: var(--accent); color: white; }
  .dt-creditor { font-size: 11.5px; color: var(--ink-3); display: inline-flex; align-items: center; gap: 4px; }
  .form-2col { display: flex; gap: 10px; }
  .form-2col > * { flex: 1; min-width: 0; }
  .f-label { font-size: 12.5px; font-weight: 500; color: var(--ink-2); display: block; margin-bottom: 6px; }
  .f-input { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 0 12px; height: 38px; background: var(--surface); font-size: 14px; outline: none; }
  .f-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .f-money { display: flex; align-items: center; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--surface); }
  .f-currency { padding: 0 12px; font-size: 14px; font-weight: 600; color: var(--ink-3); background: var(--surface-2); border-right: 1px solid var(--line); height: 38px; display: flex; align-items: center; }
  .f-money-input { flex: 1; border: none; outline: none; background: transparent; padding: 0 12px; font-size: 17px; font-weight: 600; height: 38px; color: var(--ink); }
  .icon-pick { display: flex; flex-wrap: wrap; gap: 4px; }
  .icon-pick button { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--line); background: var(--surface); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .1s; }
  .icon-pick button.on { border-color: var(--accent); background: var(--accent-soft); }
  .color-pick { display: flex; gap: 6px; flex-wrap: wrap; }
  .color-swatch { width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid transparent; cursor: pointer; transition: transform .12s; }
  .color-swatch.on { border-color: var(--ink); transform: scale(1.2); }
  @media (max-width: 600px) { .dt-overall { grid-template-columns: repeat(2, 1fr); } .form-2col { flex-direction: column; } }
`;

export default function DebtsPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const th = locale === 'th';

  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [payAmt, setPayAmt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debts');
      if (res.ok) setDebts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalDebt = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const remaining = totalDebt - totalPaid;

  const startNew = () => {
    setEditing({ id: '', nameTh: '', nameEn: '', icon: '💳', color: PALETTE[0], creditor: '', totalAmount: '', paidAmount: '', monthlyPayment: '', interestRate: '', dueDate: '' });
    setOpen(true);
  };

  const startEdit = (d: any) => {
    setEditing({ ...d, monthlyPayment: d.monthlyPayment ?? '', interestRate: d.interestRate ?? '', dueDate: d.dueDate ?? '' });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.nameTh || !editing.totalAmount) return;
    setSaving(true);
    try {
      const body = {
        nameTh: editing.nameTh,
        nameEn: editing.nameEn || editing.nameTh,
        icon: editing.icon,
        color: editing.color,
        creditor: editing.creditor || null,
        totalAmount: parseFloat(editing.totalAmount),
        paidAmount: parseFloat(editing.paidAmount) || 0,
        monthlyPayment: editing.monthlyPayment ? parseFloat(editing.monthlyPayment) : null,
        interestRate: editing.interestRate ? parseFloat(editing.interestRate) : 0,
        dueDate: editing.dueDate || null,
      };
      const url = editing.id ? `/api/debts/${editing.id}` : '/api/debts';
      await fetch(url, { method: editing.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(th ? 'ลบรายการหนี้นี้?' : 'Delete this debt?')) return;
    await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    await load();
  };

  const recordPayment = async () => {
    const amt = parseFloat(payAmt);
    if (!amt || amt <= 0) return;
    const newPaid = Math.min(payTarget.paidAmount + amt, payTarget.totalAmount);
    await fetch(`/api/debts/${payTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paidAmount: newPaid }),
    });
    setPayTarget(null);
    setPayAmt('');
    await load();
  };

  return (
    <div className="ds">
      <style>{STYLES}</style>

      <PageHeader
        title={th ? 'หนี้สิน' : 'Debts'}
        subtitle={`${debts.length} ${th ? 'รายการ' : 'items'}`}
        right={<Btn variant="primary" icon={<Plus size={15} strokeWidth={2} />} onClick={startNew}>{th ? 'เพิ่มหนี้' : 'Add debt'}</Btn>}
      />

      <div className="dt-overall">
        <div className="dt-sum">
          <span className="dt-sum-label">{th ? 'หนี้รวมทั้งหมด' : 'Total debt'}</span>
          <span className="dt-sum-val num" style={{ color: 'var(--expense)' }}>{formatTHB(totalDebt)}</span>
        </div>
        <div className="dt-sum">
          <span className="dt-sum-label">{th ? 'ชำระไปแล้ว' : 'Paid so far'}</span>
          <span className="dt-sum-val num" style={{ color: 'var(--income)' }}>{formatTHB(totalPaid)}</span>
          {totalDebt > 0 && <MiniBar value={totalPaid} max={totalDebt} color="var(--income)" />}
        </div>
        <div className="dt-sum">
          <span className="dt-sum-label">{th ? 'ยังคงค้างอยู่' : 'Still owed'}</span>
          <span className="dt-sum-val num">{formatTHB(remaining)}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', opacity: 0.4 }}>{th ? 'กำลังโหลด…' : 'Loading…'}</div>
      ) : debts.length === 0 ? (
        <Empty title={th ? 'ไม่มีหนี้สิน' : 'No debts'} subtitle={th ? 'กด + เพื่อบันทึกรายการหนี้' : 'Tap + to add a debt'} />
      ) : (
        <div className="dt-grid">
          {debts.map(d => {
            const pct = d.totalAmount > 0 ? Math.min(d.paidAmount / d.totalAmount, 1) : 0;
            const rem = Math.max(d.totalAmount - d.paidAmount, 0);
            const isPaid = d.status === 'paid';

            let hint = '';
            if (!isPaid) {
              if (d.monthlyPayment && d.monthlyPayment > 0) {
                const mLeft = Math.ceil(rem / d.monthlyPayment);
                hint = th ? `อีกประมาณ ${mLeft} เดือนจะหมดหนี้` : `~${mLeft} months to payoff`;
              } else {
                hint = th ? `คงเหลือ ${formatTHB(rem)}` : `${formatTHB(rem)} remaining`;
              }
            }

            return (
              <div key={d.id} className={`dt-card${isPaid ? ' paid' : ''}`}>
                <div className="dt-head">
                  <span className="dt-ic" style={{ background: `color-mix(in oklab, ${d.color} 14%, transparent)`, color: d.color }}>{d.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dt-name">{th ? d.nameTh : d.nameEn}</div>
                    {d.creditor && <div className="dt-sub dt-creditor">{d.creditor}</div>}
                    {!d.creditor && d.nameEn !== d.nameTh && <div className="dt-sub">{th ? d.nameEn : d.nameTh}</div>}
                  </div>
                  <div className="dt-acts">
                    <button onClick={() => startEdit(d)} title={th ? 'แก้ไข' : 'Edit'}><Pencil size={14} /></button>
                    <button className="del" onClick={() => remove(d.id)} title={th ? 'ลบ' : 'Delete'}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="dt-amts">
                  <div>
                    <div className="dt-paid num" style={{ color: isPaid ? 'var(--income)' : 'var(--ink)' }}>{formatTHB(d.paidAmount)}</div>
                    <div className="dt-of">{th ? 'จาก' : 'of'} <span className="num">{formatTHB(d.totalAmount)}</span></div>
                  </div>
                  <div className="dt-pct num" style={{ color: isPaid ? 'var(--income)' : 'var(--ink-2)' }}>{Math.round(pct * 100)}%</div>
                </div>

                <MiniBar value={d.paidAmount} max={d.totalAmount} color={isPaid ? 'var(--income)' : d.color} />

                <div className="dt-foot">
                  <span style={{ color: isPaid ? 'var(--income)' : 'var(--ink-3)' }}>
                    {isPaid ? `✓ ${th ? 'ชำระครบแล้ว!' : 'Paid off!'}` : hint}
                  </span>
                  {!isPaid && (
                    <button className="dt-pay-btn" onClick={() => { setPayTarget(d); setPayAmt(d.monthlyPayment ? String(d.monthlyPayment) : ''); }}>
                      + {th ? 'บันทึกการชำระ' : 'Record payment'}
                    </button>
                  )}
                </div>

                {d.dueDate && !isPaid && (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: -4 }}>
                    {th ? 'ครบกำหนด' : 'Due'}: {new Date(d.dueDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing?.id ? (th ? 'แก้ไขหนี้' : 'Edit debt') : (th ? 'บันทึกหนี้ใหม่' : 'New debt')}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{th ? 'ยกเลิก' : 'Cancel'}</Btn>
            <Btn variant="primary" onClick={save} disabled={!editing?.nameTh || !editing?.totalAmount || saving}>
              {saving ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'บันทึก' : 'Save')}
            </Btn>
          </>
        }
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="f-label">{th ? 'ไอคอน' : 'Icon'}</label>
              <div className="icon-pick">
                {ICONS.map(ic => (
                  <button key={ic} className={editing.icon === ic ? 'on' : ''} onClick={() => setEditing({ ...editing, icon: ic })}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'สี' : 'Color'}</label>
              <div className="color-pick">
                {PALETTE.map(c => (
                  <div key={c} className={`color-swatch${editing.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setEditing({ ...editing, color: c })} />
                ))}
              </div>
            </div>
            <div className="form-2col">
              <div>
                <label className="f-label">{th ? 'ชื่อหนี้ (ไทย)' : 'Debt name (Thai)'} *</label>
                <input className="f-input" value={editing.nameTh} onChange={e => setEditing({ ...editing, nameTh: e.target.value })} placeholder={th ? 'เช่น สินเชื่อรถยนต์' : 'e.g. Car loan'} />
              </div>
              <div>
                <label className="f-label">{th ? 'ชื่อหนี้ (อังกฤษ)' : 'Debt name (English)'}</label>
                <input className="f-input" value={editing.nameEn} onChange={e => setEditing({ ...editing, nameEn: e.target.value })} placeholder="e.g. Car loan" />
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'เจ้าหนี้ / ธนาคาร' : 'Creditor / Bank'}</label>
              <input className="f-input" value={editing.creditor} onChange={e => setEditing({ ...editing, creditor: e.target.value })} placeholder={th ? 'เช่น ธนาคารกสิกรไทย' : 'e.g. KBank'} />
            </div>
            <div>
              <label className="f-label">{th ? 'ยอดหนี้ทั้งหมด' : 'Total debt amount'} *</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input className="f-money-input num" type="number" value={editing.totalAmount} onChange={e => setEditing({ ...editing, totalAmount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'ชำระไปแล้ว' : 'Already paid'}</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input className="f-money-input num" type="number" value={editing.paidAmount} onChange={e => setEditing({ ...editing, paidAmount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="form-2col">
              <div>
                <label className="f-label">{th ? 'ผ่อนเดือนละ (ไม่บังคับ)' : 'Monthly payment (opt.)'}</label>
                <div className="f-money">
                  <div className="f-currency">฿</div>
                  <input className="f-money-input num" type="number" value={editing.monthlyPayment} onChange={e => setEditing({ ...editing, monthlyPayment: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="f-label">{th ? 'ดอกเบี้ย %/ปี (ไม่บังคับ)' : 'Interest rate %/yr (opt.)'}</label>
                <input className="f-input num" type="number" step="0.01" value={editing.interestRate} onChange={e => setEditing({ ...editing, interestRate: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'วันครบกำหนด (ไม่บังคับ)' : 'Due date (opt.)'}</label>
              <input className="f-input" type="date" value={editing.dueDate} onChange={e => setEditing({ ...editing, dueDate: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      {/* Record payment modal */}
      <Modal
        open={!!payTarget}
        onClose={() => { setPayTarget(null); setPayAmt(''); }}
        title={th ? 'บันทึกการชำระหนี้' : 'Record payment'}
        footer={
          <>
            <Btn variant="ghost" onClick={() => { setPayTarget(null); setPayAmt(''); }}>{th ? 'ยกเลิก' : 'Cancel'}</Btn>
            <Btn variant="primary" onClick={recordPayment} disabled={!payAmt || parseFloat(payAmt) <= 0}>
              {th ? 'บันทึก' : 'Record'}
            </Btn>
          </>
        }
      >
        {payTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{payTarget.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{th ? payTarget.nameTh : payTarget.nameEn}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {th ? 'คงเหลือ' : 'Remaining'}: {formatTHB(payTarget.totalAmount - payTarget.paidAmount)}
                </div>
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'จำนวนที่ชำระ' : 'Payment amount'}</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input
                  className="f-money-input num"
                  type="number"
                  autoFocus
                  value={payAmt}
                  onChange={e => setPayAmt(e.target.value)}
                  placeholder="0"
                  onKeyDown={e => e.key === 'Enter' && recordPayment()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
