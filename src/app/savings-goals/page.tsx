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

const ICONS = ["🎯", "🎁", "📱", "💻", "🚗", "🏠", "✈️", "📚", "🎮", "👗", "💄", "🏋️", "🎸", "🌟", "💍", "👶", "🐾", "🌿", "☕", "🎨"];

const STYLES = `
  .gl-overall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .gl-sum { display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
  .gl-sum-label { font-size: 11.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }
  .gl-sum-val { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  .gl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .gl-card { display: flex; flex-direction: column; gap: 12px; padding: var(--pad); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); transition: border-color .15s; }
  .gl-card.done { border-color: color-mix(in oklab, var(--income) 40%, var(--line)); background: linear-gradient(0deg, var(--income-soft), transparent 80%), var(--surface); }
  .gl-head { display: flex; align-items: center; gap: 12px; }
  .gl-ic { width: 40px; height: 40px; border-radius: 10px; font-size: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .gl-name { font-size: 14px; font-weight: 600; }
  .gl-sub { font-size: 12px; color: var(--ink-3); margin-top: 1px; }
  .gl-acts { display: inline-flex; gap: 2px; margin-left: auto; }
  .gl-acts button { width: 28px; height: 28px; border: none; background: transparent; color: var(--ink-3); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
  .gl-acts button:hover { background: var(--surface-2); color: var(--ink); }
  .gl-acts button.del:hover { color: var(--expense); }
  .gl-amts { display: flex; justify-content: space-between; align-items: flex-end; }
  .gl-saved { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  .gl-of { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
  .gl-pct { font-size: 16px; font-weight: 600; color: var(--ink-2); }
  .gl-foot { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--ink-3); gap: 8px; }
  .gl-add-btn { font-size: 12px; font-weight: 500; color: var(--accent); background: var(--accent-soft); border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .gl-add-btn:hover { background: var(--accent); color: white; }
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
  @media (max-width: 600px) { .gl-overall { grid-template-columns: repeat(2, 1fr); } .form-2col { flex-direction: column; } }
`;

export default function SavingsGoalsPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const th = locale === 'th';

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addTarget, setAddTarget] = useState<any>(null);
  const [addAmt, setAddAmt] = useState('');
  const [deductBalance, setDeductBalance] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/savings-goals');
      if (res.ok) setGoals(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const doneCount = goals.filter(g => g.status === 'completed').length;

  const startNew = () => {
    setEditing({ id: '', nameTh: '', nameEn: '', icon: '🎯', color: PALETTE[11], targetAmount: '', savedAmount: '', monthlyTarget: '', targetDate: '' });
    setOpen(true);
  };

  const startEdit = (g: any) => {
    setEditing({ ...g, monthlyTarget: g.monthlyTarget ?? '', targetDate: g.targetDate ?? '' });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.nameTh || !editing.targetAmount) return;
    setSaving(true);
    try {
      const body = {
        nameTh: editing.nameTh,
        nameEn: editing.nameEn || editing.nameTh,
        icon: editing.icon,
        color: editing.color,
        targetAmount: parseFloat(editing.targetAmount),
        savedAmount: parseFloat(editing.savedAmount) || 0,
        monthlyTarget: editing.monthlyTarget ? parseFloat(editing.monthlyTarget) : null,
        targetDate: editing.targetDate || null,
      };
      const url = editing.id ? `/api/savings-goals/${editing.id}` : '/api/savings-goals';
      await fetch(url, { method: editing.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(th ? 'ลบเป้าหมายนี้?' : 'Delete this goal?')) return;
    await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
    await load();
  };

  const addSavings = async () => {
    const amt = parseFloat(addAmt);
    if (!amt || amt <= 0) return;
    await fetch(`/api/savings-goals/${addTarget.id}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, withTransaction: deductBalance }),
    });
    setAddTarget(null);
    setAddAmt('');
    await load();
  };

  const now = new Date();

  return (
    <div className="ds">
      <style>{STYLES}</style>

      <PageHeader
        title={th ? 'ของที่อยากได้' : 'Wish List'}
        subtitle={`${goals.length} ${th ? 'เป้าหมาย' : 'goals'}`}
        right={<Btn variant="primary" icon={<Plus size={15} strokeWidth={2} />} onClick={startNew}>{th ? 'เพิ่มเป้าหมาย' : 'Add goal'}</Btn>}
      />

      <div className="gl-overall">
        <div className="gl-sum">
          <span className="gl-sum-label">{th ? 'เป้าหมายรวม' : 'Total target'}</span>
          <span className="gl-sum-val num">{formatTHB(totalTarget)}</span>
        </div>
        <div className="gl-sum">
          <span className="gl-sum-label">{th ? 'ออมไปแล้ว' : 'Total saved'}</span>
          <span className="gl-sum-val num" style={{ color: 'var(--income)' }}>{formatTHB(totalSaved)}</span>
          {totalTarget > 0 && <MiniBar value={totalSaved} max={totalTarget} color="var(--income)" />}
        </div>
        <div className="gl-sum">
          <span className="gl-sum-label">{th ? 'สำเร็จแล้ว' : 'Completed'}</span>
          <span className="gl-sum-val num" style={{ color: doneCount > 0 ? 'var(--income)' : 'var(--ink)' }}>{doneCount} / {goals.length}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', opacity: 0.4 }}>{th ? 'กำลังโหลด…' : 'Loading…'}</div>
      ) : goals.length === 0 ? (
        <Empty title={th ? 'ยังไม่มีเป้าหมาย' : 'No goals yet'} subtitle={th ? 'กด + เพื่อเพิ่มของที่อยากได้' : 'Tap + to add a wish'} />
      ) : (
        <div className="gl-grid">
          {goals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min(g.savedAmount / g.targetAmount, 1) : 0;
            const remaining = Math.max(g.targetAmount - g.savedAmount, 0);
            const done = g.status === 'completed';

            let hint = '';
            if (!done) {
              if (g.targetDate) {
                const td = new Date(g.targetDate);
                const mLeft = (td.getFullYear() - now.getFullYear()) * 12 + (td.getMonth() - now.getMonth());
                if (mLeft > 0 && remaining > 0) {
                  const need = remaining / mLeft;
                  hint = th ? `ต้องออมเดือนละ ${formatTHB(need)}` : `Save ${formatTHB(need)}/mo`;
                } else if (mLeft <= 0) {
                  hint = th ? 'ครบกำหนดแล้ว' : 'Past due';
                }
              } else if (g.monthlyTarget && g.monthlyTarget > 0) {
                const mLeft = Math.ceil(remaining / g.monthlyTarget);
                hint = th ? `อีกประมาณ ${mLeft} เดือน` : `~${mLeft} months to go`;
              } else {
                hint = th ? `ยังขาดอีก ${formatTHB(remaining)}` : `${formatTHB(remaining)} to go`;
              }
            }

            return (
              <div key={g.id} className={`gl-card${done ? ' done' : ''}`}>
                <div className="gl-head">
                  <span className="gl-ic" style={{ background: `color-mix(in oklab, ${g.color} 14%, transparent)`, color: g.color }}>{g.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="gl-name">{th ? g.nameTh : g.nameEn}</div>
                    {g.nameEn !== g.nameTh && <div className="gl-sub">{th ? g.nameEn : g.nameTh}</div>}
                  </div>
                  <div className="gl-acts">
                    <button onClick={() => startEdit(g)} title={th ? 'แก้ไข' : 'Edit'}><Pencil size={14} /></button>
                    <button className="del" onClick={() => remove(g.id)} title={th ? 'ลบ' : 'Delete'}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="gl-amts">
                  <div>
                    <div className="gl-saved num" style={{ color: done ? 'var(--income)' : 'var(--ink)' }}>{formatTHB(g.savedAmount)}</div>
                    <div className="gl-of">{th ? 'จาก' : 'of'} <span className="num">{formatTHB(g.targetAmount)}</span></div>
                  </div>
                  <div className="gl-pct num" style={{ color: done ? 'var(--income)' : 'var(--ink-2)' }}>{Math.round(pct * 100)}%</div>
                </div>

                <MiniBar value={g.savedAmount} max={g.targetAmount} color={done ? 'var(--income)' : g.color} />

                <div className="gl-foot">
                  <span style={{ color: done ? 'var(--income)' : 'var(--ink-3)' }}>
                    {done ? `✓ ${th ? 'บรรลุเป้าหมายแล้ว!' : 'Goal reached!'}` : hint}
                  </span>
                  {!done && (
                    <button className="gl-add-btn" onClick={() => { setAddTarget(g); setAddAmt(''); setDeductBalance(true); }}>
                      + {th ? 'เพิ่มเงิน' : 'Add savings'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing?.id ? (th ? 'แก้ไขเป้าหมาย' : 'Edit goal') : (th ? 'เป้าหมายใหม่' : 'New goal')}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{th ? 'ยกเลิก' : 'Cancel'}</Btn>
            <Btn variant="primary" onClick={save} disabled={!editing?.nameTh || !editing?.targetAmount || saving}>
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
                <label className="f-label">{th ? 'ชื่อ (ไทย)' : 'Name (Thai)'} *</label>
                <input className="f-input" value={editing.nameTh} onChange={e => setEditing({ ...editing, nameTh: e.target.value })} placeholder={th ? 'เช่น iPhone 16' : 'e.g. iPhone 16'} />
              </div>
              <div>
                <label className="f-label">{th ? 'ชื่อ (อังกฤษ)' : 'Name (English)'}</label>
                <input className="f-input" value={editing.nameEn} onChange={e => setEditing({ ...editing, nameEn: e.target.value })} placeholder="e.g. iPhone 16" />
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'ราคาเป้าหมาย' : 'Target amount'} *</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input className="f-money-input num" type="number" value={editing.targetAmount} onChange={e => setEditing({ ...editing, targetAmount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'ออมไปแล้ว' : 'Already saved'}</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input className="f-money-input num" type="number" value={editing.savedAmount} onChange={e => setEditing({ ...editing, savedAmount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="form-2col">
              <div>
                <label className="f-label">{th ? 'ออมเดือนละ (ไม่บังคับ)' : 'Monthly savings (opt.)'}</label>
                <div className="f-money">
                  <div className="f-currency">฿</div>
                  <input className="f-money-input num" type="number" value={editing.monthlyTarget} onChange={e => setEditing({ ...editing, monthlyTarget: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="f-label">{th ? 'ต้องการภายใน (ไม่บังคับ)' : 'Target date (opt.)'}</label>
                <input className="f-input" type="date" value={editing.targetDate} onChange={e => setEditing({ ...editing, targetDate: e.target.value })} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add savings modal */}
      <Modal
        open={!!addTarget}
        onClose={() => { setAddTarget(null); setAddAmt(''); }}
        title={th ? 'เพิ่มเงินออม' : 'Add savings'}
        footer={
          <>
            <Btn variant="ghost" onClick={() => { setAddTarget(null); setAddAmt(''); }}>{th ? 'ยกเลิก' : 'Cancel'}</Btn>
            <Btn variant="primary" onClick={addSavings} disabled={!addAmt || parseFloat(addAmt) <= 0}>
              {th ? 'เพิ่ม' : 'Add'}
            </Btn>
          </>
        }
      >
        {addTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{addTarget.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{th ? addTarget.nameTh : addTarget.nameEn}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {formatTHB(addTarget.savedAmount)} / {formatTHB(addTarget.targetAmount)}
                </div>
              </div>
            </div>
            <div>
              <label className="f-label">{th ? 'จำนวนที่ออมเพิ่ม' : 'Amount to add'}</label>
              <div className="f-money">
                <div className="f-currency">฿</div>
                <input
                  className="f-money-input num"
                  type="number"
                  autoFocus
                  value={addAmt}
                  onChange={e => setAddAmt(e.target.value)}
                  placeholder="0"
                  onKeyDown={e => e.key === 'Enter' && addSavings()}
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: deductBalance ? 'var(--accent-soft)' : 'var(--surface-2)', border: '1px solid', borderColor: deductBalance ? 'color-mix(in oklab, var(--accent) 30%, var(--line))' : 'var(--line)', borderRadius: 10, cursor: 'pointer', transition: 'all .15s' }}>
              <input
                type="checkbox"
                checked={deductBalance}
                onChange={e => setDeductBalance(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: deductBalance ? 'var(--accent-ink)' : 'var(--ink)' }}>
                  {th ? 'หักจากยอดคงเหลือ' : 'Deduct from balance'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  {th ? 'บันทึกเป็นรายจ่าย "ออมเงิน" ให้อัตโนมัติ' : 'Auto-record as "Savings" expense'}
                </div>
              </div>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
