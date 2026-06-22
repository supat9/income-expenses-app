'use client';

import { useState } from 'react';
import { PageHeader, Card, Btn, Select, Badge } from '@/components/ui';
import { LogOut, Download, Sun, Moon } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { I18N } from '@/lib/translations';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 11, background: on ? "var(--accent)" : "var(--line)",
        border: "none", cursor: "pointer", padding: 2, transition: "background .15s", position: "relative",
      }}
    >
      <span style={{
        display: "block", width: 18, height: 18, background: "white", borderRadius: "50%",
        transition: "transform .15s", transform: on ? "translateX(16px)" : "none",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const { tweaks, setTweak } = useTweaks();
  const locale = tweaks.locale;
  const { data: session } = useSession();
  const router = useRouter();
  const [budgetAlert, setBudgetAlert] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div>
        <div className="set-name">{label}</div>
        {sub && <div className="set-sub">{sub}</div>}
      </div>
      {children}
    </li>
  );

  const Seg = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: React.ReactNode }[] }) => (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );

  const huePresets = [270, 235, 195, 158, 30, 350];
  const initials = session?.user?.name?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="ds">
      <style>{`
        .prof { display: flex; align-items: center; gap: 16px; }
        .prof-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; flex-shrink: 0; }
        .prof-name { font-size: 16px; font-weight: 600; }
        .prof-email { font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }
        .prof-meta { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .set-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; }
        .set-name { font-size: 13.5px; font-weight: 500; }
        .set-sub { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
        .seg { display: inline-flex; padding: 3px; background: var(--surface-2); border-radius: 8px; }
        .seg button { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; padding: 6px 11px; font-size: 12.5px; color: var(--ink-2); border-radius: 5px; cursor: pointer; font-weight: 500; }
        .seg button.is-on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-sm); }
        .hue-picker { display: flex; gap: 6px; }
        .hue-sw { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .12s; }
        .hue-sw:hover { transform: scale(1.1); }
        .hue-sw.is-on { border-color: var(--ink); }
      `}</style>

      <PageHeader
        title={locale === "th" ? "ตั้งค่า" : "Settings"}
        subtitle={locale === "th" ? "โปรไฟล์และความชอบ" : "Profile & preferences"}
      />

      <Card title={locale === "th" ? "โปรไฟล์" : "Profile"}>
        <div className="prof">
          <div className="prof-avatar">{initials}</div>
          <div style={{ flex: 1 }}>
            <div className="prof-name">{session?.user?.name || "—"}</div>
            <div className="prof-email">{session?.user?.email || "—"}</div>
            <div className="prof-meta">
              <Badge>{locale === "th" ? "Google" : "Google"}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card title={locale === "th" ? "การแสดงผล" : "Display"}>
        <ul className="set-list">
          <Row label={locale === "th" ? "ภาษา" : "Language"} sub={locale === "th" ? "เปลี่ยนภาษาของแอปทั้งหมด" : "App-wide locale"}>
            <Seg value={tweaks.locale} onChange={v => setTweak("locale", v)} options={[{ value: "th", label: "ไทย" }, { value: "en", label: "EN" }]} />
          </Row>
          <Row label={locale === "th" ? "ธีม" : "Theme"} sub={locale === "th" ? "สว่าง / มืด" : "Light or dark"}>
            <Seg
              value={tweaks.theme}
              onChange={v => setTweak("theme", v)}
              options={[
                { value: "light", label: <><Sun size={13} />{locale === "th" ? "สว่าง" : "Light"}</> },
                { value: "dark",  label: <><Moon size={13} />{locale === "th" ? "มืด" : "Dark"}</> },
              ]}
            />
          </Row>
          <Row label={locale === "th" ? "ความหนาแน่น" : "Density"} sub={locale === "th" ? "ขนาดของรายการ" : "Row size in lists"}>
            <Seg
              value={tweaks.density}
              onChange={v => setTweak("density", v)}
              options={[
                { value: "compact", label: locale === "th" ? "แน่น" : "Compact" },
                { value: "default", label: locale === "th" ? "ปกติ" : "Default" },
                { value: "cozy",    label: locale === "th" ? "โล่ง" : "Cozy" },
              ]}
            />
          </Row>
          <Row label={locale === "th" ? "สีหลัก" : "Accent color"} sub={locale === "th" ? "เลือกโทนสีของแอป" : "Pick a hue"}>
            <div className="hue-picker">
              {huePresets.map(h => (
                <button key={h} className={`hue-sw${tweaks.accentHue === h ? " is-on" : ""}`} style={{ background: `oklch(0.55 0.18 ${h})` }} onClick={() => setTweak("accentHue", h)} />
              ))}
            </div>
          </Row>
          <Row label={locale === "th" ? "แถบข้างกระชับ" : "Compact sidebar"} sub={locale === "th" ? "แสดงแค่ไอคอน" : "Icons only"}>
            <Toggle on={tweaks.compactSidebar} onChange={v => setTweak("compactSidebar", v)} />
          </Row>
        </ul>
      </Card>

      <Card title={locale === "th" ? "การแจ้งเตือน" : "Notifications"}>
        <ul className="set-list">
          <Row label={locale === "th" ? "เตือนเมื่อใช้เกินงบ" : "Budget alerts"} sub={locale === "th" ? "แจ้งเตือนเมื่อใช้จ่ายเกินกำหนด" : "Notify when spending exceeds budget"}>
            <Toggle on={budgetAlert} onChange={setBudgetAlert} />
          </Row>
          <Row label={locale === "th" ? "สรุปรายสัปดาห์" : "Weekly summary"} sub={locale === "th" ? "อีเมลสรุปทุกวันจันทร์" : "Email recap every Monday"}>
            <Toggle on={weeklySummary} onChange={setWeeklySummary} />
          </Row>
          <Row label={locale === "th" ? "สกุลเงิน" : "Currency"} sub={locale === "th" ? "สกุลเงินหลักที่ใช้แสดง" : "Primary display currency"}>
            <Select value="THB" options={[{ value: "THB", label: "฿ THB — Thai Baht" }, { value: "USD", label: "$ USD" }]} />
          </Row>
        </ul>
      </Card>

      <Card title={locale === "th" ? "ข้อมูล" : "Data"}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: 'center' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ height: 36, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }} />
          <span style={{ color: 'var(--ink-3)' }}>—</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ height: 36, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }} />
          <Btn variant="secondary" icon={<Download size={14} />} onClick={async () => {
            try {
              const params = new URLSearchParams();
              if (startDate) params.set('from', startDate);
              if (endDate) params.set('to', endDate);
              if (!startDate && !endDate) params.set('months', '1200');
              const txUrl = '/api/transactions?' + params.toString();
              const [catRes, txRes] = await Promise.all([
                fetch('/api/categories'),
                fetch(txUrl),
              ]);
              if (!catRes.ok || !txRes.ok) throw new Error('Failed to fetch data');
              const [categories, transactions] = await Promise.all([catRes.json(), txRes.json()]);
              const rows = [["Date", "Amount", "Category", "Note", "Account"]];
              transactions.forEach((tx: any) => {
                const c = categories.find((c: any) => c.id === tx.categoryId);
                rows.push([tx.date.slice(0, 10), tx.amount, c?.en || tx.categoryId, tx.note || "", tx.account || ""]);
              });
              const csv = rows.map((r: any[]) => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `ledger-${Date.now()}.csv`; a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              // minimal error handling — keep UI simple
              // eslint-disable-next-line no-console
              console.error('Export CSV failed', err);
              alert(locale === 'th' ? 'ส่งออกล้มเหลว' : 'Export failed');
            }
          }}>{locale === "th" ? "ส่งออก CSV" : "Export CSV"}</Btn>
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" icon={<LogOut size={14} />} onClick={handleSignOut}>
            {locale === "th" ? "ออกจากระบบ" : "Sign out"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
