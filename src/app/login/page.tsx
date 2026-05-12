'use client';

import { useState, Suspense } from 'react';
import { Wallet, Check } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { cx, Btn } from '@/components/ui';
import { Sparkline } from '@/components/Charts';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const { tweaks, setTweak } = useTweaks();
  const locale = tweaks.locale;
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
    await signIn('google', { callbackUrl });
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
            <Btn
              variant="secondary" size="lg" full type="button"
              onClick={handleGoogleLogin} disabled={loading}
              icon={!loading && (
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
            >
              {loading ? (locale === "th" ? "กำลังเข้าสู่ระบบ…" : "Signing in…") : (locale === "th" ? "ดำเนินการต่อด้วย Google" : "Continue with Google")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
