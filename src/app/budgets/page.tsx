'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, Btn, Modal, Empty, cx } from '@/components/ui';
import { MiniBar } from '@/components/Charts';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/translations';
import { formatTHB } from '@/lib/formatters';

export default function BudgetsPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;

  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, budRes, txRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/budgets"),
        fetch("/api/transactions?months=1"),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (budRes.ok) setBudgets(await budRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const monthExpenseByCat = useMemo(() => {
    const m = new Map<string, number>();
    transactions.filter(t => {
      const d = new Date(t.date);
      return t.amount < 0 && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).forEach(t => m.set(t.categoryId, (m.get(t.categoryId) || 0) + (-t.amount)));
    return m;
  }, [transactions]);

  const expenseCats = categories.filter(c => c.kind === "expense");
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (monthExpenseByCat.get(b.categoryId) || 0), 0);
  const overCount = budgets.filter(b => (monthExpenseByCat.get(b.categoryId) || 0) > b.limit).length;
  const monthLabel = `${I18N[locale].monthsLong[now.getMonth()]} ${now.getFullYear() + (locale === "th" ? 543 : 0)}`;

  const startNew = () => { setEditing({ id: "", categoryId: "", limit: 1000 }); setOpen(true); };
  const startEdit = (b: any) => { setEditing({ ...b }); setOpen(true); };

  const save = async () => {
    if (!editing.categoryId || !editing.limit) return;
    setSaving(true);
    try {
      if (editing.id) {
        await fetch(`/api/budgets/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: editing.limit }),
        });
      } else {
        await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: editing.categoryId, limit: editing.limit }),
        });
      }
      setOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    await loadData();
  };

  return (
    <div className="ds">
      <style>{`
        .budget-overall { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .bo-card { display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
        .bo-label { font-size: 11.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }
        .bo-val { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
        .bg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; }
        .bg-card { display: flex; flex-direction: column; gap: 12px; padding: var(--pad); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); transition: border-color .15s; }
        .bg-card.is-over { border-color: color-mix(in oklab, var(--expense) 30%, var(--line)); background: linear-gradient(0deg, var(--expense-soft), transparent 80%), var(--surface); }
        .bg-card.is-warn { border-color: color-mix(in oklab, var(--warn) 30%, var(--line)); }
        .bg-card-head { display: flex; align-items: center; gap: 12px; }
        .cat-ic { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; font-size: 18px; flex-shrink: 0; }
        .bg-name { font-size: 14px; font-weight: 600; color: var(--ink); }
        .bg-en { font-size: 12px; color: var(--ink-3); margin-top: 1px; }
        .bg-actions { display: inline-flex; gap: 2px; margin-left: auto; }
        .bg-actions button { width: 28px; height: 28px; border: none; background: transparent; color: var(--ink-3); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .bg-actions button:hover { background: var(--surface-2); color: var(--ink); }
        .bg-actions button:last-child:hover { color: var(--expense); }
        .bg-amounts { display: flex; justify-content: space-between; align-items: flex-end; }
        .bg-spent { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .bg-of { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
        .bg-pct { font-size: 16px; font-weight: 600; }
        .bg-pct.is-over { color: var(--expense); }
        .bg-pct.is-warn { color: var(--warn); }
        .bg-foot { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-3); }
        .atm-label { font-size: 12.5px; font-weight: 500; color: var(--ink-2); display: block; margin-bottom: 6px; }
        .atm-cats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .atm-cat { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--line); background: var(--surface); border-radius: 8px; font-size: 13px; cursor: pointer; transition: all .12s; }
        .atm-cat:hover { background: var(--surface-2); }
        .atm-amount { display: flex; align-items: center; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--surface); }
        .atm-currency { padding: 0 12px; font-size: 15px; font-weight: 600; color: var(--ink-3); background: var(--surface-2); border-right: 1px solid var(--line); height: 40px; display: flex; align-items: center; }
        .atm-amount-input { flex: 1; border: none; outline: none; background: transparent; padding: 0 12px; font-size: 18px; font-weight: 600; height: 40px; color: var(--ink); }
      `}</style>

      <PageHeader
        title={locale === "th" ? "งบประมาณ" : "Budgets"}
        subtitle={`${monthLabel} · ${budgets.length} ${locale === "th" ? "หมวดที่ตั้งงบ" : "tracked"}`}
        right={<Btn variant="primary" icon={<Plus size={15} strokeWidth={2} />} onClick={startNew}>{locale === "th" ? "เพิ่มงบ" : "New budget"}</Btn>}
      />

      <div className="budget-overall">
        <div className="bo-card">
          <span className="bo-label">{locale === "th" ? "งบรวมเดือนนี้" : "Total budget"}</span>
          <span className="bo-val num">{formatTHB(totalLimit)}</span>
        </div>
        <div className="bo-card">
          <span className="bo-label">{locale === "th" ? "ใช้ไปแล้ว" : "Spent"}</span>
          <span className="bo-val num">{formatTHB(totalSpent)}</span>
          <MiniBar value={totalSpent} max={totalLimit} color={totalSpent > totalLimit ? "var(--expense)" : "var(--accent)"} />
        </div>
        <div className="bo-card">
          <span className="bo-label">{locale === "th" ? "หมวดที่เกินงบ" : "Over budget"}</span>
          <span className="bo-val num" style={{ color: overCount > 0 ? "var(--expense)" : "var(--ink)" }}>{overCount}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", opacity: 0.4 }}>{locale === "th" ? "กำลังโหลด…" : "Loading…"}</div>
      ) : budgets.length === 0 ? (
        <Empty title={locale === "th" ? "ยังไม่มีงบประมาณ" : "No budgets yet"} subtitle={locale === "th" ? "กด + เพื่อตั้งงบประมาณรายหมวด" : "Tap + to set a budget by category"} />
      ) : (
        <div className="bg-grid">
          {budgets.map(b => {
            const c = categories.find(c => c.id === b.categoryId);
            if (!c) return null;
            const spent = monthExpenseByCat.get(b.categoryId) || 0;
            const pct = b.limit > 0 ? spent / b.limit : 0;
            const remaining = b.limit - spent;
            const status = pct > 1 ? "over" : pct > 0.85 ? "warn" : "ok";
            return (
              <div key={b.id} className={cx("bg-card", `is-${status}`)}>
                <div className="bg-card-head">
                  <span className="cat-ic" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>{c.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bg-name">{locale === "th" ? c.th : c.en}</div>
                    <div className="bg-en">{locale === "th" ? c.en : c.th}</div>
                  </div>
                  <div className="bg-actions">
                    <button onClick={() => startEdit(b)} title={locale === "th" ? "แก้ไข" : "Edit"}><Pencil size={14} /></button>
                    <button onClick={() => remove(b.id)} title={locale === "th" ? "ลบ" : "Delete"}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="bg-amounts">
                  <div>
                    <div className="bg-spent num">{formatTHB(spent)}</div>
                    <div className="bg-of">{locale === "th" ? "จาก" : "of"} <span className="num">{formatTHB(b.limit)}</span></div>
                  </div>
                  <div className={cx("bg-pct", "num", `is-${status}`)}>{Math.round(pct * 100)}%</div>
                </div>
                <MiniBar value={spent} max={b.limit} color={status === "over" ? "var(--expense)" : status === "warn" ? "var(--warn)" : c.color} />
                <div className="bg-foot">
                  {status === "over" ? (
                    <span style={{ color: "var(--expense)" }}>
                      <AlertTriangle size={12} /> {locale === "th" ? "เกินงบ" : "Over by"} <span className="num">{formatTHB(-remaining)}</span>
                    </span>
                  ) : status === "warn" ? (
                    <span style={{ color: "var(--warn)" }}>
                      <AlertTriangle size={12} /> {locale === "th" ? "ใกล้เต็มแล้ว ·" : "Almost full ·"} <span className="num">{formatTHB(remaining)}</span> {locale === "th" ? "เหลือ" : "left"}
                    </span>
                  ) : (
                    <span><span className="num">{formatTHB(remaining)}</span> {locale === "th" ? "เหลือใช้" : "remaining"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing?.id ? (locale === "th" ? "แก้ไขงบประมาณ" : "Edit budget") : (locale === "th" ? "ตั้งงบประมาณใหม่" : "New budget")}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{locale === "th" ? "ยกเลิก" : "Cancel"}</Btn>
            <Btn variant="primary" onClick={save} disabled={!editing?.categoryId || !editing?.limit || saving}>
              {saving ? (locale === "th" ? "กำลังบันทึก…" : "Saving…") : (locale === "th" ? "บันทึก" : "Save")}
            </Btn>
          </>
        }
      >
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!editing.id && (
              <div>
                <label className="atm-label">{locale === "th" ? "หมวดหมู่" : "Category"}</label>
                <div className="atm-cats">
                  {expenseCats
                    .filter(c => !budgets.find(b => b.categoryId === c.id) || c.id === editing.categoryId)
                    .map(c => (
                      <button
                        key={c.id}
                        className={cx("atm-cat", editing.categoryId === c.id && "is-active")}
                        style={editing.categoryId === c.id ? { borderColor: c.color, background: `color-mix(in oklab, ${c.color} 12%, transparent)`, color: c.color } : {}}
                        onClick={() => setEditing({ ...editing, categoryId: c.id })}
                      >
                        <span>{c.icon}</span>
                        <span>{locale === "th" ? c.th : c.en}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div>
              <label className="atm-label">{locale === "th" ? "จำนวนต่อเดือน" : "Monthly limit"}</label>
              <div className="atm-amount">
                <div className="atm-currency">฿</div>
                <input
                  className="atm-amount-input num"
                  type="number"
                  value={editing.limit}
                  onChange={e => setEditing({ ...editing, limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
