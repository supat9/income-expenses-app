'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, Card, Btn, Empty, Select, TextInput, Badge, cx } from '@/components/Primitives';
import { Plus, Search, ArrowDown, ArrowUp, Download, Pencil, Trash2 } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/i18n';
import { formatTHB, formatDate } from '@/lib/formatters';
import { AddTransactionModal } from '@/components/AddTransactionModal';

export default function TransactionsPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterKind, setFilterKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

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

  const filtered = useMemo(() => {
    let arr = transactions;
    if (filterKind === "income") arr = arr.filter(t => t.amount > 0);
    else if (filterKind === "expense") arr = arr.filter(t => t.amount < 0);
    if (filterCat !== "all") arr = arr.filter(t => t.categoryId === filterCat);
    if (from) arr = arr.filter(t => new Date(t.date) >= new Date(from));
    if (to) arr = arr.filter(t => new Date(t.date) <= new Date(to + "T23:59:59"));
    if (q) {
      const ql = q.toLowerCase();
      arr = arr.filter(t => {
        const c = categories.find(c => c.id === t.categoryId);
        return (t.note || "").toLowerCase().includes(ql)
          || (c && (c.th.includes(ql) || c.en.toLowerCase().includes(ql)))
          || String(Math.abs(t.amount)).includes(ql);
      });
    }
    return [...arr].sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transactions, q, filterCat, filterKind, from, to, sortDir, categories]);

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    filtered.forEach(tx => {
      const key = new Date(tx.date).toDateString();
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(tx);
    });
    return [...m.entries()];
  }, [filtered]);

  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  const hasFilter = !!(q || filterCat !== "all" || filterKind !== "all" || from || to);

  const onSubmitTx = async (tx: any) => {
    if (tx.id) {
      await fetch(`/api/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: tx.date, amount: tx.amount, categoryId: tx.categoryId, note: tx.note, account: tx.account }),
      });
    } else {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: tx.date, amount: tx.amount, categoryId: tx.categoryId, note: tx.note, account: tx.account }),
      });
    }
    await loadData();
  };

  const deleteTx = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await loadData();
  };

  const exportCSV = () => {
    const rows = [["Date", "Amount", "Category", "Note", "Account"]];
    filtered.forEach(tx => {
      const c = categories.find(c => c.id === tx.categoryId);
      rows.push([tx.date.slice(0, 10), tx.amount, c?.en || tx.categoryId, tx.note || "", tx.account || ""]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ledger-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ds">
      <style>{`
        .tx-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .tx-sum-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
        .tx-sum-label { font-size: 12px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
        .tx-sum-card .num { font-size: 18px; font-weight: 600; }
        .tx-filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 14px var(--pad); border-bottom: 1px solid var(--line); }
        .tx-date { height: 36px; padding: 0 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; font-size: 13px; color: var(--ink); outline: none; }
        .tx-date:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .tx-thead { display: grid; grid-template-columns: 36px 2fr 1.4fr 80px 1fr 64px; gap: 16px; padding: 9px var(--pad); background: var(--surface-2); border-bottom: 1px solid var(--line); font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
        .tx-sort { background: none; border: none; color: var(--ink-3); cursor: pointer; padding: 0; font: inherit; display: inline-flex; align-items: center; gap: 4px; text-transform: inherit; letter-spacing: inherit; font-size: inherit; }
        .tx-group-head { display: flex; justify-content: space-between; align-items: center; padding: 9px var(--pad); background: var(--surface-2); font-size: 12px; color: var(--ink-3); font-weight: 500; }
        .tx-row { display: grid; grid-template-columns: 36px 2fr 1.4fr 80px 1fr 64px; gap: 16px; align-items: center; padding: 11px var(--pad); border-bottom: 1px solid var(--line-2); transition: background .1s; }
        .tx-row:hover { background: var(--surface-2); }
        .tx-row:last-child { border-bottom: none; }
        .tx-note > div:first-child { font-size: 13.5px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tx-account { font-size: 11.5px; color: var(--ink-3); margin-top: 1px; }
        .tx-time { font-size: 12px; color: var(--ink-3); }
        .tx-amt { font-size: 13.5px; font-weight: 600; text-align: right; }
        .tx-amt.pos { color: var(--income); }
        .tx-amt.neg { color: var(--ink); }
        .tx-actions { display: inline-flex; gap: 2px; opacity: 0; transition: opacity .1s; }
        .tx-row:hover .tx-actions { opacity: 1; }
        .tx-actions button { width: 28px; height: 28px; border: none; background: transparent; color: var(--ink-3); border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .tx-actions button:hover { background: var(--surface); color: var(--ink); }
        .tx-actions button:last-child:hover { color: var(--expense); }
      `}</style>

      <PageHeader
        title={locale === "th" ? "รายการทั้งหมด" : "Transactions"}
        subtitle={`${filtered.length} ${locale === "th" ? "รายการ" : "items"} · ${formatTHB(totalIncome - totalExpense, { sign: true })} ${locale === "th" ? "สุทธิ" : "net"}`}
        right={
          <>
            <Btn variant="secondary" icon={<Download size={14} />} onClick={exportCSV}>CSV</Btn>
            <Btn variant="primary" icon={<Plus size={15} strokeWidth={2} />} onClick={() => { setEditing(null); setAddOpen(true); }}>
              {locale === "th" ? "เพิ่มรายการ" : "Add"}
            </Btn>
          </>
        }
      />

      <div className="tx-summary">
        <div className="tx-sum-card">
          <span className="tx-sum-label">{t.common.income}</span>
          <span className="num" style={{ color: "var(--income)" }}>{formatTHB(totalIncome)}</span>
        </div>
        <div className="tx-sum-card">
          <span className="tx-sum-label">{t.common.expense}</span>
          <span className="num" style={{ color: "var(--expense)" }}>{formatTHB(totalExpense)}</span>
        </div>
        <div className="tx-sum-card">
          <span className="tx-sum-label">{t.common.balance}</span>
          <span className="num">{formatTHB(totalIncome - totalExpense, { sign: true })}</span>
        </div>
      </div>

      <Card padded={false}>
        <div className="tx-filters">
          <TextInput value={q} onChange={setQ} placeholder={locale === "th" ? "ค้นหาหมายเหตุ, หมวด, จำนวน..." : "Search note, category, amount..."} icon={<Search size={14} />} style={{ flex: 1, minWidth: 200 }} />
          <Select value={filterKind} onChange={setFilterKind} options={[
            { value: "all", label: locale === "th" ? "ทุกชนิด" : "All types" },
            { value: "income", label: t.common.income },
            { value: "expense", label: t.common.expense },
          ]} />
          <Select value={filterCat} onChange={setFilterCat} options={[
            { value: "all", label: locale === "th" ? "ทุกหมวด" : "All categories" },
            ...categories.map(c => ({ value: c.id, label: locale === "th" ? c.th : c.en })),
          ]} />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="tx-date" />
          <span style={{ color: "var(--ink-3)", fontSize: 12 }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="tx-date" />
          {hasFilter && (
            <Btn variant="ghost" size="sm" onClick={() => { setQ(""); setFilterCat("all"); setFilterKind("all"); setFrom(""); setTo(""); }}>
              {locale === "th" ? "ล้าง" : "Clear"}
            </Btn>
          )}
        </div>

        <div className="tx-thead">
          <span></span>
          <span>{t.common.note}</span>
          <span>{t.common.category}</span>
          <button className="tx-sort" onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}>
            {t.common.date} {sortDir === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
          </button>
          <span style={{ textAlign: "right" }}>{t.common.amount}</span>
          <span></span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", opacity: 0.4 }}>{locale === "th" ? "กำลังโหลด…" : "Loading…"}</div>
        ) : filtered.length === 0 ? (
          <Empty title={locale === "th" ? "ไม่พบรายการ" : "No transactions"} subtitle={locale === "th" ? "ลองเปลี่ยนตัวกรอง" : "Try adjusting your filters"} />
        ) : grouped.map(([day, items]) => (
          <div key={day}>
            <div className="tx-group-head">
              <span>{formatDate(items[0].date, locale, "medium")}</span>
              <span className="num">{formatTHB(items.reduce((s: number, t: any) => s + t.amount, 0), { sign: true })}</span>
            </div>
            {items.map((tx: any) => {
              const c = categories.find(c => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="tx-row">
                  <span className="rcat" style={{ background: `color-mix(in oklab, ${c?.color || "var(--ink-3)"} 14%, transparent)`, color: c?.color }}>{c?.icon || "•"}</span>
                  <div className="tx-note" style={{ minWidth: 0 }}>
                    <div>{tx.note || (locale === "th" ? c?.th : c?.en)}</div>
                    <div className="tx-account">{tx.account}</div>
                  </div>
                  <div><Badge color={c?.color}>{locale === "th" ? c?.th : c?.en}</Badge></div>
                  <div className="tx-time num">{new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className={cx("tx-amt", "num", tx.amount > 0 ? "pos" : "neg")}>{formatTHB(tx.amount, { sign: true })}</div>
                  <div className="tx-actions">
                    <button onClick={() => { setEditing(tx); setAddOpen(true); }} title={t.common.edit}><Pencil size={14} /></button>
                    <button onClick={() => deleteTx(tx.id)} title={t.common.delete}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </Card>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onSubmitTx} categories={categories} editing={editing} />
    </div>
  );
}
