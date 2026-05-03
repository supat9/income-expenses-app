'use client';

import React, { useRef, useState, useEffect } from 'react';
import { I18N, Locale } from '@/lib/i18n';
import { formatTHB } from '@/lib/formatters';

interface AreaLineProps {
  data: { income: number; expense: number; monthIndex: number; year: number }[];
  height?: number;
  padding?: { l: number; r: number; t: number; b: number };
  locale?: Locale;
  showAxis?: boolean;
}

export function AreaLine({ 
  data, 
  height = 200, 
  padding = { l: 36, r: 12, t: 12, b: 22 }, 
  locale = "th", 
  showAxis = true 
}: AreaLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(560);
  
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const scaleY = (v: number) => padding.t + (height - padding.t - padding.b) * (1 - v / max);
  const scaleX = (i: number) => padding.l + (w - padding.l - padding.r) * (data.length === 1 ? 0.5 : i / (data.length - 1));

  const linePath = (key: 'income' | 'expense') => data.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d[key])}`).join(" ");
  const areaPath = (key: 'income' | 'expense') => `${linePath(key)} L ${scaleX(data.length - 1)} ${height - padding.b} L ${scaleX(0)} ${height - padding.b} Z`;

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (max * i) / ticks);

  const [hover, setHover] = useState<number | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.round(((x - padding.l) / (w - padding.l - padding.r)) * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHover(idx);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: "block" }}>
        <defs>
          <linearGradient id="gIncome" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--income)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--income)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--expense)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--expense)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxis && tickValues.map((v, i) => (
          <g key={i}>
            <line x1={padding.l} x2={w - padding.r} y1={scaleY(v)} y2={scaleY(v)} stroke="var(--line-2)" strokeDasharray={i === 0 ? "" : "3 4"} />
            <text x={padding.l - 8} y={scaleY(v) + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)">{v >= 1000 ? (v/1000).toFixed(0) + "K" : Math.round(v)}</text>
          </g>
        ))}
        <path d={areaPath("income")} fill="url(#gIncome)" />
        <path d={areaPath("expense")} fill="url(#gExpense)" />
        <path d={linePath("income")} stroke="var(--income)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={linePath("expense")} stroke="var(--expense)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <text x={scaleX(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--ink-3)">{I18N[locale].months[d.monthIndex]}</text>
            {hover === i && (
              <>
                <line x1={scaleX(i)} x2={scaleX(i)} y1={padding.t} y2={height - padding.b} stroke="var(--ink-3)" strokeDasharray="3 3" opacity="0.5" />
                <circle cx={scaleX(i)} cy={scaleY(d.income)} r="4" fill="var(--income)" stroke="var(--surface)" strokeWidth="2" />
                <circle cx={scaleX(i)} cy={scaleY(d.expense)} r="4" fill="var(--expense)" stroke="var(--surface)" strokeWidth="2" />
              </>
            )}
            {hover !== i && i === data.length - 1 && (
              <>
                <circle cx={scaleX(i)} cy={scaleY(d.income)} r="3.5" fill="var(--income)" stroke="var(--surface)" strokeWidth="2" />
                <circle cx={scaleX(i)} cy={scaleY(d.expense)} r="3.5" fill="var(--expense)" stroke="var(--surface)" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>
      {hover !== null && (() => {
        const d = data[hover];
        const cxValue = scaleX(hover);
        const left = Math.max(8, Math.min(w - 168, cxValue - 80));
        return (
          <div style={{ position: "absolute", left, top: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12, boxShadow: "var(--shadow-md)", pointerEvents: "none", minWidth: 152 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{I18N[locale].monthsLong[d.monthIndex]} {d.year}</div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--income)" }}><span>● {I18N[locale].common.income}</span><span className="num">{formatTHB(d.income, { compact: true })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--expense)" }}><span>● {I18N[locale].common.expense}</span><span className="num">{formatTHB(d.expense, { compact: true })}</span></div>
          </div>
        );
      })()}
    </div>
  );
}

interface DonutProps {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  label: string;
  sublabel: string;
}

export function Donut({ slices, size = 200, thickness = 28, label, sublabel }: DonutProps) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 2;
  const ri = r - thickness;
  const cxValue = size / 2, cyValue = size / 2;
  let acc = 0;
  const [hover, setHover] = useState<number | null>(null);

  const arcs = slices.map((s, i) => {
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = endA - startA > Math.PI ? 1 : 0;
    const x1 = cxValue + r * Math.cos(startA), y1 = cyValue + r * Math.sin(startA);
    const x2 = cxValue + r * Math.cos(endA),   y2 = cyValue + r * Math.sin(endA);
    const xi1 = cxValue + ri * Math.cos(endA), yi1 = cyValue + ri * Math.sin(endA);
    const xi2 = cxValue + ri * Math.cos(startA), yi2 = cyValue + ri * Math.sin(startA);
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...s, path, pct: (s.value / total) * 100 };
  });

  const shown = hover != null ? arcs[hover] : null;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} opacity={hover != null && hover !== i ? 0.35 : 1}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ transition: "opacity .12s", cursor: "pointer" }} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".05em", textTransform: "uppercase" }}>{shown ? shown.label : sublabel}</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }} className="num">{shown ? formatTHB(shown.value, { compact: true }) : label}</div>
        {shown && <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{shown.pct.toFixed(1)}%</div>}
      </div>
    </div>
  );
}

export function MiniBar({ value, max, color = "var(--accent)", height = 6, bg }: { value: number, max: number, color?: string, height?: number, bg?: string }) {
  const pct = Math.min(1, Math.max(0, value / (max || 1)));
  return (
    <div style={{ width: "100%", height, background: bg || "var(--line-2)", borderRadius: height/2, overflow: "hidden" }}>
      <div style={{ width: `${pct*100}%`, height: "100%", background: color, borderRadius: height/2, transition: "width .35s ease" }} />
    </div>
  );
}

export function Sparkline({ values, color = "var(--accent)", height = 32, width = 90 }: { values: number[], color?: string, height?: number, width?: number }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${(i/(values.length-1))*width} ${height - ((v - min)/range)*(height-2) - 1}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
