'use client';

import React, { useState } from 'react';
import { Wallet, Check, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useTweaks } from '@/components/Providers';
import { I18N } from '@/lib/i18n';
import { cx, Btn } from '@/components/Primitives';
import { Sparkline } from '@/components/Charts';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { tweaks, setTweak } = useTweaks();
  const locale = tweaks.locale;
  const t = I18N[locale];

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);
    await signIn(provider, { callbackUrl: '/dashboard' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
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

          <div className="auth-tabs">
            <button className={cx(mode === "login" && "is-on")} onClick={() => setMode("login")}>{locale === "th" ? "เข้าสู่ระบบ" : "Sign in"}</button>
            <button className={cx(mode === "register" && "is-on")} onClick={() => setMode("register")}>{locale === "th" ? "สมัครสมาชิก" : "Create account"}</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className={cx("auth-error", error.includes("สำเร็จ") || error.includes("successful") ? "is-success" : "")}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            {mode === "register" && (
              <div className="field">
                <label className="field-label">{locale === "th" ? "ชื่อ-นามสกุล" : "Full name"}</label>
                <div className={cx("field-input", focused === "name" && "is-focused")}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={locale === "th" ? "ปฐมพร ทองพิทักษ์" : "e.g. Pathomporn T."} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} autoComplete="name" />
                </div>
              </div>
            )}
            <div className="field">
              <label className="field-label">{locale === "th" ? "อีเมล" : "Email"}</label>
              <div className={cx("field-input", focused === "email" && "is-focused")}>
                <span className="field-icon"><Mail size={16} /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={locale === "th" ? "name@example.com" : "name@example.com"} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <div className="field-label-row">
                <label className="field-label">{locale === "th" ? "รหัสผ่าน" : "Password"}</label>
                {mode === "login" && <button type="button" className="auth-link field-label-link">{locale === "th" ? "ลืมรหัสผ่าน?" : "Forgot?"}</button>}
              </div>
              <div className={cx("field-input", focused === "pw" && "is-focused")}>
                <span className="field-icon"><Lock size={16} /></span>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={locale === "th" ? "อย่างน้อย 8 ตัวอักษร" : "At least 8 characters"} onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                <button type="button" className="field-trail" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="auth-row">
                <label className="auth-check"><input type="checkbox" defaultChecked /> {locale === "th" ? "จดจำฉันไว้ 30 วัน" : "Keep me signed in for 30 days"}</label>
              </div>
            )}

            <Btn variant="primary" size="lg" full type="submit" disabled={loading}>
              {loading ? (locale === "th" ? "กำลังประมวลผล…" : "Processing…") : (mode === "login" ? (locale === "th" ? "เข้าสู่ระบบ" : "Sign in") : (locale === "th" ? "สร้างบัญชี" : "Create account"))}
            </Btn>

            <div className="auth-divider"><span>{locale === "th" ? "หรือ" : "or"}</span></div>

            <Btn variant="secondary" size="lg" full type="button" onClick={() => handleOAuthLogin('google')}>{locale === "th" ? "ดำเนินการต่อด้วย Google" : "Continue with Google"}</Btn>
          </form>

          <div className="auth-foot">
            {mode === "login"
              ? (locale === "th" ? "ยังไม่มีบัญชี?" : "No account?")
              : (locale === "th" ? "มีบัญชีแล้ว?" : "Already have an account?")}
            {" "}
            <button className="auth-link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? (locale === "th" ? "สมัครสมาชิก" : "Sign up") : (locale === "th" ? "เข้าสู่ระบบ" : "Sign in")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
