'use client';

import React, { useState } from 'react';
import { Wallet, Check } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { cx, Btn } from '@/components/Primitives';
import { Sparkline } from '@/components/Charts';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const { tweaks, setTweak } = useTweaks();
  const locale = tweaks.locale;
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="auth">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><Wallet size={20} /></div>
          <div>
            <div className="auth-brandname">Ledger</div>
            <div className="auth-brandsub">{locale === "th" ? "บัญชีรายรับ-รายจ่าย" : "Income & expenses"}</div>
          </div>
        </div>

        <div className="auth-hero">
          <h1>{locale === "th" ? "บันทึกทุกบาท เห็นภาพรวมที่ใช่" : "Track every baht. See the bigger picture."}</h1>
          <p>{locale === "th" ? "บันทึกรายรับ-รายจ่าย ตั้งงบประมาณ และวิเคราะห์การใช้จ่ายของคุณ ทั้งหมดในที่เดียว" : "Log income and expenses, set budgets, and understand where your money goes — all in one place."}</p>
        </div>

        <ul className="auth-feats">
          <li><Check size={14} /> {locale === "th" ? "เพิ่มรายการและจัดหมวดหมู่อัตโนมัติ" : "Quick capture & smart categories"}</li>
          <li><Check size={14} /> {locale === "th" ? "งบประมาณและการแจ้งเตือนเมื่อเกินงบ" : "Budgets with overspend alerts"}</li>
          <li><Check size={14} /> {locale === "th" ? "กราฟวิเคราะห์รายเดือน-รายปี" : "Monthly & yearly analytics"}</li>
        </ul>

        <div className="auth-strip">
          <div>
            <div className="auth-strip-label">{locale === "th" ? "ยอดออมเดือนนี้" : "Saved this month"}</div>
            <div className="num auth-strip-val">฿24,860</div>
          </div>
          <Sparkline values={[12000, 14500, 13200, 18000, 19200, 22400, 24860]} color="var(--accent)" width={120} height={32} />
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-locale-pick">
            <button className={cx(locale === "th" && "is-on")} onClick={() => setTweak("locale", "th")}>ไทย</button>
            <button className={cx(locale === "en" && "is-on")} onClick={() => setTweak("locale", "en")}>EN</button>
          </div>

          <div className="auth-hero-sm">
            <h2>{locale === "th" ? "เข้าสู่ระบบ" : "Sign in"}</h2>
            <p>{locale === "th" ? "ใช้บัญชี Google เพื่อเริ่มต้น" : "Use your Google account to get started"}</p>
          </div>

          <div className="auth-form">
            <Btn variant="secondary" size="lg" full type="button" onClick={handleGoogleLogin} disabled={loading}>
              {loading ? (locale === "th" ? "กำลังเข้าสู่ระบบ…" : "Signing in…") : (locale === "th" ? "ดำเนินการต่อด้วย Google" : "Continue with Google")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
