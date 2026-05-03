'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PageHeader, Stat, Card, Btn, Empty, cx } from '@/components/Primitives';
import { AreaLine, Donut, MiniBar } from '@/components/Charts';
import { Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Wallet, Sparkles, AlertTriangle } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/i18n';
import { formatTHB, formatDate } from '@/lib/formatters';
import Link from 'next/link';
import { AddTransactionModal } from '@/components/AddTransactionModal';

type ChartPeriod = "week" | "month" | "6m";

export default function DashboardPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("6m");

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, txRes, budRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/transactions?months=6"),
        fetch("/api/budgets"),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (budRes.ok) setBudgets(await budRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  // 6m: aggregate by month (original)
  const monthly = useMemo(() => {
    const map = new Map();
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) map.set(key, { year: d.getFullYear(), monthIndex: d.getMonth(), income: 0, expense: 0 });
      const e = map.get(key);
      if (tx.amount >= 0) e.income += tx.amount; else e.expense += -tx.amount;
    });
    return [...map.values()].sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex).slice(-6);
  }, [transactions]);

  // week: aggregate by day for current week (Mon–Sun)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    mon.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return { date: d, label: I18N[locale].weekdays[i], income: 0, expense: 0, monthIndex: d.getMonth(), year: d.getFullYear() };
    });

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      d.setHours(0, 0, 0, 0);
      const idx = days.findIndex(day => day.date.getTime() === d.getTime());
      if (idx === -1) return;
      if (tx.amount >= 0) days[idx].income += tx.amount;
      else days[idx].expense += -tx.amount;
    });

    return days;
  }, [transactions, locale]);

  // month: aggregate by week within current month
  const monthlyWeekData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const weeks: { label: string; income: number; expense: number; monthIndex: number; year: number }[] = [];
    let weekStart = 1;
    while (weekStart <= lastDay) {
      const weekEnd = Math.min(weekStart + 6, lastDay);
      weeks.push({ label: `${weekStart}–${weekEnd}`, income: 0, expense: 0, monthIndex: month, year });
      weekStart += 7;
    }

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const weekIdx = Math.floor((d.getDate() - 1) / 7);
      if (weekIdx < weeks.length) {
        if (tx.amount >= 0) weeks[weekIdx].income += tx.amount;
        else weeks[weekIdx].expense += -tx.amount;
      }
    });

    return weeks;
  }, [transactions]);

  const chartData = chartPeriod === "6m" ? monthly : chartPeriod === "month" ? monthlyWeekData : weeklyData;
  const chartSubtitle = (() => {
    if (chartPeriod === "week") return locale === "th" ? "สัปดาห์นี้ (รายวัน)" : "This week (daily)";
    if (chartPeriod === "month") {
      const now = new Date();
      return `${I18N[locale].monthsLong[now.getMonth()]} ${now.getFullYear() + (locale === "th" ? 543 : 0)}`;
    }
    return locale === "th" ? "6 เดือนล่าสุด" : "Last 6 months";
  })();

  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === monthCursor.getFullYear() && d.getMonth() === monthCursor.getMonth();
  });

  const lastMonthDate = new Date(monthCursor);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
  });

  const sumIncome = (arr: any[]) => arr.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const sumExpense = (arr: any[]) => -arr.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  const incomeMonth = sumIncome(monthTxs);
  const expenseMonth = sumExpense(monthTxs);
  const lastIncome = sumIncome(lastMonthTxs) || 1;
  const lastExpense = sumExpense(lastMonthTxs) || 1;
  const incomeDelta = ((incomeMonth - lastIncome) / lastIncome) * 100;
  const expenseDelta = ((expenseMonth - lastExpense) / lastExpense) * 100;
  const net = incomeMonth - expenseMonth;
  const lastNet = lastIncome - lastExpense || 1;
  const netDelta = ((net - lastNet) / Math.abs(lastNet)) * 100;

  const expenseByCat = new Map<string, number>();
  monthTxs.filter(t => t.amount < 0).forEach(t => {
    expenseByCat.set(t.categoryId, (expenseByCat.get(t.categoryId) || 0) + (-t.amount));
  });

  const donutSlices = [...expenseByCat.entries()]
    .map(([id, value]) => {
      const c = categories.find(c => c.id === id);
      return c ? { label: locale === "th" ? c.th : c.en, value, color: c.color } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.value || 0) - (a?.value || 0)) as { label: string; value: number; color: string }[];

  const recent = monthTxs.slice(0, 6);

  const budgetUtil = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const spent = expenseByCat.get(b.categoryId) || 0;
    return { ...b, cat, spent, pct: spent / b.limit };
  }).sort((a, b) => b.pct - a.pct);

  const overBudget = budgetUtil.filter(b => b.pct > 1);

  const monthLabel = `${I18N[locale].monthsLong[monthCursor.getMonth()]} ${monthCursor.getFullYear() + (locale === "th" ? 543 : 0)}`;

  const navMonth = (delta: number) => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + delta);
    setMonthCursor(d);
  };

  const chartTabs: { key: ChartPeriod; label: string }[] = [
    { key: "week", label: locale === "th" ? "สัปดาห์" : "Week" },
    { key: "month", label: locale === "th" ? "เดือน" : "Month" },
    { key: "6m", label: locale === "th" ? "6 เดือน" : "6M" },
  ];

  if (loading) {
    return (
      <div className="ds" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
        <span style={{ opacity: 0.5 }}>{locale === "th" ? "กำลังโหลด…" : "Loading…"}</span>
      </div>
    );
  }

  return (
    <div className="ds">
      <PageHeader
        title={locale === "th" ? "ภาพรวม" : "Overview"}
        subtitle={locale === "th" ? "สรุปการเงินส่วนตัวของคุณ" : "Your money at a glance"}
        right={
          <>
            <div className="month-nav">
              <button onClick={() => navMonth(-1)}><ChevronLeft size={16} /></button>
              <span className="num">{monthLabel}</span>
              <button onClick={() => navMonth(1)}><ChevronRight size={16} /></button>
            </div>
            <Btn variant="primary" icon={<Plus size={15} strokeWidth={2} />} onClick={() => { setEditing(null); setAddOpen(true); }}>
              {locale === "th" ? "เพิ่มรายการ" : "Add"}
            </Btn>
          </>
        }
      />

      {overBudget.length > 0 && (
        <div className="alert">
          <AlertTriangle size={16} />
          <span>
            <strong>{overBudget.length} {locale === "th" ? "หมวดเกินงบ" : (overBudget.length === 1 ? "category over budget" : "categories over budget")}</strong>
            {" — "}
            {overBudget.slice(0, 3).map(b => locale === "th" ? b.cat?.th : b.cat?.en).join(", ")}
          </span>
          <Link href="/budgets" className="alert-link">{locale === "th" ? "ดูงบประมาณ" : "View budgets"} →</Link>
        </div>
      )}

      <div className="stats-grid">
        <Stat label={locale === "th" ? "รายรับ" : "Income"} value={formatTHB(incomeMonth)} delta={incomeDelta} kind="income" icon={<ArrowUp size={14} />} />
        <Stat label={locale === "th" ? "รายจ่าย" : "Expenses"} value={formatTHB(expenseMonth)} delta={expenseDelta} kind="expense" icon={<ArrowDown size={14} />} />
        <Stat label={locale === "th" ? "ยอดคงเหลือ" : "Net balance"} value={(net >= 0 ? "" : "−") + formatTHB(net)} delta={netDelta} kind="neutral" icon={<Wallet size={14} />} />
        <Stat label={locale === "th" ? "อัตราการออม" : "Savings rate"} value={incomeMonth > 0 ? Math.round((net / incomeMonth) * 100) + "%" : "—"} icon={<Sparkles size={14} />} />
      </div>

      <div className="dash-grid">
        <Card
          title={locale === "th" ? "รายรับเทียบกับรายจ่าย" : "Income vs. Expense"}
          subtitle={chartSubtitle}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 2, background: "var(--line-2)", borderRadius: 7, padding: 2 }}>
                {chartTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setChartPeriod(tab.key)}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 5,
                      border: "none",
                      fontSize: 12,
                      fontWeight: chartPeriod === tab.key ? 600 : 400,
                      background: chartPeriod === tab.key ? "var(--surface)" : "transparent",
                      color: chartPeriod === tab.key ? "var(--ink-1)" : "var(--ink-3)",
                      cursor: "pointer",
                      boxShadow: chartPeriod === tab.key ? "var(--shadow-sm)" : "none",
                      transition: "all .12s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="legend">
                <span className="legend-item"><i style={{ background: "var(--income)" }}></i> {t.common.income}</span>
                <span className="legend-item"><i style={{ background: "var(--expense)" }}></i> {t.common.expense}</span>
              </div>
            </div>
          }
        >
          <AreaLine data={chartData} locale={locale} height={240} />
        </Card>

        <Card title={locale === "th" ? "รายจ่ายตามหมวดหมู่" : "Spending by category"} subtitle={monthLabel}>
          {donutSlices.length === 0 ? (
            <Empty title={locale === "th" ? "ยังไม่มีรายจ่าย" : "No expenses yet"} subtitle={locale === "th" ? "เพิ่มรายการเพื่อดูสัดส่วน" : "Add a transaction to see the split"} />
          ) : (
            <>
              <Donut slices={donutSlices} size={180} thickness={26} label={formatTHB(expenseMonth, { compact: true })} sublabel={locale === "th" ? "รวม" : "Total"} />
              <ul className="legend-list">
                {donutSlices.slice(0, 5).map(s => (
                  <li key={s.label}>
                    <span><i style={{ background: s.color }}></i>{s.label}</span>
                    <span className="num">{formatTHB(s.value, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="dash-grid">
        <Card
          title={locale === "th" ? "รายการล่าสุด" : "Recent transactions"}
          subtitle={`${recent.length} ${locale === "th" ? "รายการในเดือนนี้" : "in this month"}`}
          action={<Btn variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>{locale === "th" ? "ดูทั้งหมด" : "View all"}</Btn>}
          padded={false}
        >
          {recent.length === 0 ? (
            <Empty title={locale === "th" ? "ยังไม่มีรายการ" : "No transactions"} subtitle={locale === "th" ? "กด + เพื่อเพิ่มรายการแรก" : "Tap + to add your first transaction"} />
          ) : (
            <ul className="recent">
              {recent.map(tx => {
                const c = categories.find(c => c.id === tx.categoryId);
                return (
                  <li key={tx.id} onClick={() => { setEditing(tx); setAddOpen(true); }} style={{ cursor: 'pointer' }}>
                    <span className="rcat" style={{ background: `color-mix(in oklab, ${c?.color || "var(--ink-3)"} 14%, transparent)`, color: c?.color }}>{c?.icon || "•"}</span>
                    <div className="rinfo">
                      <div className="rnote">{tx.note || (locale === "th" ? c?.th : c?.en)}</div>
                      <div className="rsub">{locale === "th" ? c?.th : c?.en} · {formatDate(tx.date, locale, "short")}</div>
                    </div>
                    <div className={cx("ramt", "num", tx.amount > 0 ? "pos" : "neg")}>
                      {formatTHB(tx.amount, { sign: true })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title={locale === "th" ? "งบประมาณ" : "Budget rails"}
          subtitle={locale === "th" ? "ใช้ไปแล้วของเดือนนี้" : "This month's utilization"}
          action={<Btn variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>{locale === "th" ? "จัดการ" : "Manage"}</Btn>}
        >
          {budgetUtil.length === 0 ? (
            <Empty title={locale === "th" ? "ยังไม่มีงบประมาณ" : "No budgets set"} subtitle="" />
          ) : (
            <ul className="budget-list">
              {budgetUtil.slice(0, 5).map(b => (
                <li key={b.id}>
                  <div className="budget-top">
                    <span className="budget-cat">
                      <span style={{ color: b.cat?.color }}>{b.cat?.icon}</span>
                      {locale === "th" ? b.cat?.th : b.cat?.en}
                    </span>
                    <span className={cx("budget-pct", "num", b.pct > 1 && "over")}>{Math.round(b.pct * 100)}%</span>
                  </div>
                  <MiniBar value={b.spent} max={b.limit} color={b.pct > 1 ? "var(--expense)" : b.pct > 0.85 ? "var(--warn)" : b.cat?.color} />
                  <div className="budget-foot num">
                    {formatTHB(b.spent, { compact: true })} / {formatTHB(b.limit, { compact: true })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={onSubmitTx}
        categories={categories}
        editing={editing}
      />
    </div>
  );
}
