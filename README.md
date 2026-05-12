# บัญชีรายรับ-รายจ่าย

แอปบัญชีส่วนตัวสำหรับบันทึกรายรับ-รายจ่าย พร้อมแดชบอร์ด รายงาน และการจัดการงบประมาณ สร้างด้วย Next.js 16 + Supabase

---

## Features

- **Dashboard** — ภาพรวมรายรับ-รายจ่ายรายเดือน กราฟ Area/Bar/Donut และสถานะงบประมาณ
- **Transactions** — บันทึก แก้ไข ลบรายการ กรองด้วย หมวด / ประเภท / ช่วงวันที่ และ export CSV
- **Categories** — จัดการหมวดหมู่รายรับ-รายจ่ายพร้อม icon และสี
- **Budgets** — ตั้งงบประมาณรายหมวด ดูยอดใช้จ่ายเทียบงบ
- **Reports** — รายงานสรุปรายเดือน/ปี แยกตามหมวดหมู่
- **Savings Goals** — ตั้งเป้าออมเงิน บันทึกยอดฝากและดูความคืบหน้า
- **Debts** — ติดตามหนี้สิน บันทึกการชำระและดูยอดคงเหลือ
- **รองรับ 2 ภาษา** — ไทย / English สลับได้ใน Settings
- **Dark / Light mode** — ปรับธีมได้

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth v4 + Supabase Adapter |
| Styling | CSS Variables (custom design system) |
| Icons | Lucide React |
| Runtime | Node.js |

---

## Getting Started

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` จากตัวอย่างด้านล่าง:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

> ค่าเหล่านี้หาได้จาก Supabase Dashboard → Project Settings → API

### 3. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # API Routes
│   │   ├── auth/             # NextAuth handler
│   │   ├── transactions/     # CRUD transactions
│   │   ├── categories/       # CRUD categories
│   │   ├── budgets/          # CRUD budgets
│   │   ├── savings-goals/    # CRUD + deposit
│   │   └── debts/            # CRUD + payment
│   ├── dashboard/            # หน้าแดชบอร์ด
│   ├── transactions/         # หน้ารายการ
│   ├── categories/           # หน้าหมวดหมู่
│   ├── budgets/              # หน้างบประมาณ
│   ├── reports/              # หน้ารายงาน
│   ├── savings-goals/        # หน้าเป้าออมเงิน
│   ├── debts/                # หน้าหนี้สิน
│   └── settings/             # หน้าตั้งค่า
├── components/
│   ├── ui.tsx                # Design system components
│   ├── Charts.tsx            # Chart components
│   ├── AddTransactionModal.tsx
│   ├── Navigation.tsx
│   └── Providers.tsx
└── lib/
    ├── translations.ts       # i18n (th/en)
    └── formatters.ts         # ฟอร์แมตตัวเลข / วันที่
```

---

## Scripts

```bash
npm run dev      # รัน development server
npm run build    # build สำหรับ production
npm run start    # รัน production server
npm run lint     # ตรวจสอบ code
```
