'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, Card, Stat, Empty } from '@/components/ui';
import { MiniBar } from '@/components/Charts';
import { ArrowUp, ArrowDown, Wallet, Sparkles } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/translations';
import { formatTHB } from '@/lib/formatters';

export default function ReportsPage() {
  const { tweaks } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"6mo" | "12mo">("6mo");

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

  const monthly = useMemo(() => {
    const m = new Map<string, { year: number; monthIndex: number; income: number; expense: number }>();
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!m.has(key)) m.set(key, { year: d.getFullYear(), monthIndex: d.getMonth(), income: 0, expense: 0 });
      const e = m.get(key)!;
      if (tx.amount > 0) e.income += tx.amount; else e.expense += -tx.amount;
    });
    return [...m.values()].sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex);
  }, [transactions]);

  const data = period === "6mo" ? monthly.slice(-6) : monthly.slice(-12);
  const maxBar = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  const ttlIncome = data.reduce((s, d) => s + d.income, 0);
  const ttlExpense = data.reduce((s, d) => s + d.expense, 0);
  const avgIncome = data.length ? ttlIncome / data.length : 0;
  const avgExpense = data.length ? ttlExpense / data.length : 0;
  const savingsRate = ttlIncome > 0 ? ((ttlIncome - ttlExpense) / ttlIncome) * 100 : 0;

  const catTotals = new Map<string, number>();
  transactions.filter(t => t.amount < 0).forEach(t => {
    catTotals.set(t.categoryId, (catTotals.get(t.categoryId) || 0) + (-t.amount));
  });
  const topCats = [...catTotals.entries()]
    .map(([id, v]) => ({ ...categories.find(c => c.id === id), value: v }))
    .filter(c => c.id)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const maxCat = topCats[0]?.value || 1;

  const netData = monthly.slice(-6);
  const maxNet = Math.max(...netData.map(m => Math.abs(m.income - m.expense)), 1);

  return (
    <div className="ds">
      <style>{`
        .period-tabs { display: inline-flex; padding: 3px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }
        .period-tabs button { border: none; background: transparent; padding: 6px 12px; font-size: 12.5px; color: var(--ink-2); border-radius: 5px; cursor: pointer; font-weight: 500; }
        .period-tabs button.is-on { background: var(--accent-soft); color: var(--accent-ink); }
        .rep-bars { display: flex; gap: 12px; align-items: flex-end; height: 220px; padding: 8px 0; }
        .rep-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
        .rep-bar-pair { flex: 1; display: flex; gap: 4px; align-items: flex-end; width: 100%; }
        .rep-bar-stack { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; }
        .rep-bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 3px; position: relative; transition: height .4s ease; }
        .rep-bar.income { background: var(--income); }
        .rep-bar.expense { background: var(--expense); }
        .rep-bar-num { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 600; color: white; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .rep-bar-label { font-size: 11.5px; color: var(--ink-3); }
        .top-cats { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .top-cats li { display: flex; align-items: center; gap: 12px; }
        .cat-ic-sm { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; font-size: 15px; flex-shrink: 0; }
        .net-list { display: flex; flex-direction: column; gap: 10px; }
        .net-row { display: grid; grid-template-columns: 36px 1fr 90px; gap: 10px; align-items: center; }
        .net-month { font-size: 12px; color: var(--ink-3); }
        .net-bar-wrap { height: 22px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
        .net-bar { height: 100%; transition: width .4s ease; border-radius: 4px; }
        .net-val { font-size: 12.5px; font-weight: 600; text-align: right; }
      `}</style>

      <PageHeader
        title={locale === "th" ? "รายงาน" : "Reports"}
        subtitle={locale === "th" ? "ภาพรวมตามช่วงเวลา" : "Time-period summaries"}
        right={
          <div className="period-tabs">
            <button className={period === "6mo" ? "is-on" : ""} onClick={() => setPeriod("6mo")}>{locale === "th" ? "6 เดือน" : "6 months"}</button>
            <button className={period === "12mo" ? "is-on" : ""} onClick={() => setPeriod("12mo")}>{locale === "th" ? "12 เดือน" : "12 months"}</button>
          </div>
        }
      />

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", opacity: 0.4 }}>{locale === "th" ? "กำลังโหลด…" : "Loading…"}</div>
      ) : (
        <>
          <div className="stats-grid">
            <Stat label={locale === "th" ? "รายรับเฉลี่ย/เดือน" : "Avg income / mo"} value={formatTHB(avgIncome, { compact: true })} kind="income" icon={<ArrowUp size={14} />} />
            <Stat label={locale === "th" ? "รายจ่ายเฉลี่ย/เดือน" : "Avg expense / mo"} value={formatTHB(avgExpense, { compact: true })} kind="expense" icon={<ArrowDown size={14} />} />
            <Stat label={locale === "th" ? "ออมรวม" : "Total saved"} value={formatTHB(ttlIncome - ttlExpense, { compact: true })} icon={<Wallet size={14} />} />
            <Stat label={locale === "th" ? "อัตราการออม" : "Savings rate"} value={savingsRate.toFixed(1) + "%"} icon={<Sparkles size={14} />} />
          </div>

          <Card
            title={locale === "th" ? "เปรียบเทียบรายรับ-รายจ่าย" : "Income vs. Expense comparison"}
            subtitle={period === "6mo" ? (locale === "th" ? "6 เดือนล่าสุด" : "Last 6 months") : (locale === "th" ? "12 เดือนล่าสุด" : "Last 12 months")}
          >
            {data.length === 0 ? (
              <Empty title={locale === "th" ? "ยังไม่มีข้อมูล" : "No data yet"} subtitle="" />
            ) : (
              <>
                <div className="rep-bars">
                  {data.map((d, i) => (
                    <div key={i} className="rep-bar-col">
                      <div className="rep-bar-pair">
                        <div className="rep-bar-stack">
                          <div className="rep-bar income" style={{ height: `${(d.income / maxBar) * 100}%` }}>
                            {d.income > maxBar * 0.35 && <span className="rep-bar-num">{formatTHB(d.income, { compact: true })}</span>}
                          </div>
                        </div>
                        <div className="rep-bar-stack">
                          <div className="rep-bar expense" style={{ height: `${(d.expense / maxBar) * 100}%` }}>
                            {d.expense > maxBar * 0.35 && <span className="rep-bar-num">{formatTHB(d.expense, { compact: true })}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="rep-bar-label">{I18N[locale].months[d.monthIndex]}</div>
                    </div>
                  ))}
                </div>
                <div className="legend" style={{ justifyContent: "center", marginTop: 10 }}>
                  <span className="legend-item"><i style={{ background: "var(--income)" }}></i>{t.common.income}</span>
                  <span className="legend-item"><i style={{ background: "var(--expense)" }}></i>{t.common.expense}</span>
                </div>
              </>
            )}
          </Card>

          <div className="dash-grid">
            <Card title={locale === "th" ? "หมวดยอดนิยม" : "Top spending categories"} subtitle={locale === "th" ? "รวมตลอดช่วงข้อมูล" : "All-time"}>
              {topCats.length === 0 ? (
                <Empty title={locale === "th" ? "ยังไม่มีข้อมูล" : "No data"} subtitle="" />
              ) : (
                <ul className="top-cats">
                  {topCats.map(c => (
                    <li key={c.id}>
                      <span className="cat-ic-sm" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>{c.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{locale === "th" ? c.th : c.en}</span>
                          <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{formatTHB(c.value, { compact: true })}</span>
                        </div>
                        <MiniBar value={c.value} max={maxCat} color={c.color} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={locale === "th" ? "แนวโน้มสุทธิ" : "Net trend"} subtitle={locale === "th" ? "6 เดือนล่าสุด" : "Last 6 months"}>
              {netData.length === 0 ? (
                <Empty title={locale === "th" ? "ยังไม่มีข้อมูล" : "No data"} subtitle="" />
              ) : (
                <div className="net-list">
                  {[...netData].reverse().map((m, i) => {
                    const net = m.income - m.expense;
                    return (
                      <div key={i} className="net-row">
                        <span className="net-month">{I18N[locale].months[m.monthIndex]}</span>
                        <div className="net-bar-wrap">
                          <div className="net-bar" style={{ width: `${(Math.abs(net) / maxNet) * 100}%`, background: net >= 0 ? "var(--income)" : "var(--expense)" }} />
                        </div>
                        <span className="net-val num" style={{ color: net >= 0 ? "var(--income)" : "var(--expense)" }}>
                          {formatTHB(net, { sign: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
