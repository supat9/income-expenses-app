'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, Card, Btn, Modal, Empty, cx } from '@/components/Primitives';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { formatTHB } from '@/lib/formatters';

const PALETTE = [
  "oklch(0.65 0.16 35)","oklch(0.62 0.14 240)","oklch(0.65 0.16 320)",
  "oklch(0.65 0.13 195)","oklch(0.55 0.14 280)","oklch(0.7 0.14 145)",
  "oklch(0.6 0.16 10)","oklch(0.65 0.15 295)","oklch(0.6 0.13 158)",
  "oklch(0.65 0.13 175)","oklch(0.6 0.13 130)","oklch(0.55 0.18 270)",
];

const ICONS = ["🍜","🚇","🛍️","💡","🏠","✈️","🩺","🎬","💼","💻","📈","📦","🐾","🎁","📚","☕","🎮","🚗","🐶","🌿"];

export default function CategoriesPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;

  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, txRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/transactions?months=12"),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const usage = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    transactions.forEach(t => {
      const e = m.get(t.categoryId) || { count: 0, total: 0 };
      e.count += 1; e.total += Math.abs(t.amount);
      m.set(t.categoryId, e);
    });
    return m;
  }, [transactions]);

  const sorted = [...categories].sort((a, b) => (usage.get(b.id)?.total || 0) - (usage.get(a.id)?.total || 0));
  const expenseCats = sorted.filter(c => c.kind === "expense");
  const incomeCats = sorted.filter(c => c.kind === "income");

  const startNew = (kind: string) => { setEditing({ id: "", th: "", en: "", color: PALETTE[0], icon: "📦", kind }); setOpen(true); };
  const startEdit = (c: any) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing.th || !editing.en) return;
    setSaving(true);
    try {
      if (editing.id) {
        await fetch(`/api/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ th: editing.th, en: editing.en, color: editing.color, icon: editing.icon }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: editing.kind, th: editing.th, en: editing.en, color: editing.color, icon: editing.icon }),
        });
      }
      setOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await loadData();
  };

  const CatGroup = ({ title, items, kind }: { title: string; items: any[]; kind: string }) => (
    <Card
      title={title}
      action={<Btn variant="soft" size="sm" icon={<Plus size={13} strokeWidth={2} />} onClick={() => startNew(kind)}>{locale === "th" ? "หมวดใหม่" : "New"}</Btn>}
      padded={false}
    >
      {items.length === 0 ? (
        <Empty title={locale === "th" ? "ยังไม่มีหมวด" : "No categories"} subtitle="" />
      ) : (
        <ul className="cat-list">
          {items.map(c => {
            const u = usage.get(c.id) || { count: 0, total: 0 };
            return (
              <li key={c.id}>
                <span className="cat-ic" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>{c.icon}</span>
                <div>
                  <div className="cat-name">{locale === "th" ? c.th : c.en}</div>
                  <div className="cat-en">{locale === "th" ? c.en : c.th}</div>
                </div>
                <div className="cat-stat">
                  <div className="num">{formatTHB(u.total, { compact: true })}</div>
                  <div className="cat-count">{u.count} {locale === "th" ? "รายการ" : "txns"}</div>
                </div>
                <div className="cat-actions">
                  <button onClick={() => startEdit(c)} title={locale === "th" ? "แก้ไข" : "Edit"}><Pencil size={14} /></button>
                  <button onClick={() => remove(c.id)} title={locale === "th" ? "ลบ" : "Delete"}><Trash2 size={14} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="ds">
      <style>{`
        .cat-list { list-style: none; padding: 0; margin: 0; }
        .cat-list li { display: grid; grid-template-columns: 44px 1fr auto auto; gap: 14px; align-items: center; padding: 12px var(--pad); border-bottom: 1px solid var(--line-2); }
        .cat-list li:last-child { border-bottom: none; }
        .cat-ic { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; font-size: 18px; flex-shrink: 0; }
        .cat-name { font-size: 14px; font-weight: 500; color: var(--ink); }
        .cat-en { font-size: 12px; color: var(--ink-3); margin-top: 1px; }
        .cat-stat { text-align: right; }
        .cat-stat .num { font-size: 13.5px; font-weight: 600; }
        .cat-count { font-size: 11.5px; color: var(--ink-3); margin-top: 1px; }
        .cat-actions { display: inline-flex; gap: 2px; }
        .cat-actions button { width: 30px; height: 30px; border: none; background: transparent; color: var(--ink-3); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .cat-actions button:hover { background: var(--surface-2); color: var(--ink); }
        .cat-actions button:last-child:hover { color: var(--expense); }
        .cat-form { display: flex; flex-direction: column; gap: 14px; }
        .cat-form-row { display: flex; gap: 12px; align-items: flex-end; }
        .cat-preview { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 12px; font-size: 26px; flex-shrink: 0; }
        .atm-label { font-size: 12.5px; font-weight: 500; color: var(--ink-2); display: block; margin-bottom: 6px; }
        .atm-text { width: 100%; height: 36px; padding: 0 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; font-size: 13.5px; outline: none; }
        .atm-text:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .color-pal { display: flex; flex-wrap: wrap; gap: 6px; }
        .color-sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .12s; }
        .color-sw:hover { transform: scale(1.1); }
        .color-sw.is-on { border-color: var(--ink); transform: scale(1.1); outline: 2px solid white; outline-offset: -4px; }
        .icon-pal { display: flex; flex-wrap: wrap; gap: 4px; }
        .icon-sw { width: 36px; height: 36px; border: 1px solid var(--line); background: var(--surface); border-radius: 8px; cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; }
        .icon-sw.is-on { border-color: var(--accent); background: var(--accent-soft); }
      `}</style>

      <PageHeader
        title={locale === "th" ? "หมวดหมู่" : "Categories"}
        subtitle={locale === "th" ? `${categories.length} หมวด · จัดการสีและไอคอน` : `${categories.length} categories · manage colors & icons`}
      />

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", opacity: 0.4 }}>{locale === "th" ? "กำลังโหลด…" : "Loading…"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CatGroup title={locale === "th" ? "หมวดรายจ่าย" : "Expense categories"} items={expenseCats} kind="expense" />
          <CatGroup title={locale === "th" ? "หมวดรายรับ" : "Income categories"} items={incomeCats} kind="income" />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing?.id ? (locale === "th" ? "แก้ไขหมวดหมู่" : "Edit category") : (locale === "th" ? "หมวดหมู่ใหม่" : "New category")}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{locale === "th" ? "ยกเลิก" : "Cancel"}</Btn>
            <Btn variant="primary" onClick={save} disabled={!editing?.th || !editing?.en || saving}>
              {saving ? (locale === "th" ? "กำลังบันทึก…" : "Saving…") : (locale === "th" ? "บันทึก" : "Save")}
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="cat-form">
            <div className="cat-form-row">
              <span className="cat-preview" style={{ background: `color-mix(in oklab, ${editing.color} 14%, transparent)`, color: editing.color }}>{editing.icon}</span>
              <div style={{ flex: 1 }}>
                <label className="atm-label">{locale === "th" ? "ชื่อ (ไทย)" : "Thai name"}</label>
                <input className="atm-text" value={editing.th} onChange={e => setEditing({ ...editing, th: e.target.value })} placeholder="เช่น อาหาร" />
              </div>
            </div>
            <div>
              <label className="atm-label">{locale === "th" ? "ชื่อ (English)" : "English name"}</label>
              <input className="atm-text" value={editing.en} onChange={e => setEditing({ ...editing, en: e.target.value })} placeholder="e.g. Food" />
            </div>
            <div>
              <label className="atm-label">{locale === "th" ? "สี" : "Color"}</label>
              <div className="color-pal">
                {PALETTE.map(p => (
                  <button key={p} className={cx("color-sw", editing.color === p && "is-on")} style={{ background: p }} onClick={() => setEditing({ ...editing, color: p })} />
                ))}
              </div>
            </div>
            <div>
              <label className="atm-label">{locale === "th" ? "ไอคอน" : "Icon"}</label>
              <div className="icon-pal">
                {ICONS.map(i => (
                  <button key={i} className={cx("icon-sw", editing.icon === i && "is-on")} onClick={() => setEditing({ ...editing, icon: i })}>{i}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
