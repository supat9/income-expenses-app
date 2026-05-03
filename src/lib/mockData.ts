export const CATEGORIES_INITIAL = [
  { id: "food",     th: "อาหาร",       en: "Food & dining",  color: "oklch(0.65 0.16 35)",  icon: "🍜", kind: "expense" },
  { id: "transit",  th: "เดินทาง",     en: "Transport",       color: "oklch(0.62 0.14 240)", icon: "🚇", kind: "expense" },
  { id: "shopping", th: "ช้อปปิ้ง",     en: "Shopping",        color: "oklch(0.65 0.16 320)", icon: "🛍️", kind: "expense" },
  { id: "utility",  th: "ยูทิลิตี้",     en: "Utilities",       color: "oklch(0.65 0.13 195)", icon: "💡", kind: "expense" },
  { id: "rent",     th: "ค่าเช่า",      en: "Rent / housing",  color: "oklch(0.55 0.14 280)", icon: "🏠", kind: "expense" },
  { id: "travel",   th: "ท่องเที่ยว",   en: "Travel",          color: "oklch(0.7 0.14 145)",  icon: "✈️", kind: "expense" },
  { id: "health",   th: "สุขภาพ",      en: "Health",          color: "oklch(0.6 0.16 10)",   icon: "🩺", kind: "expense" },
  { id: "ent",      th: "บันเทิง",      en: "Entertainment",   color: "oklch(0.65 0.15 295)", icon: "🎬", kind: "expense" },
  { id: "salary",   th: "เงินเดือน",    en: "Salary",          color: "oklch(0.6 0.13 158)",  icon: "💼", kind: "income" },
  { id: "freelance",th: "ฟรีแลนซ์",    en: "Freelance",       color: "oklch(0.65 0.13 175)", icon: "💻", kind: "income" },
  { id: "invest",   th: "ลงทุน",       en: "Investments",     color: "oklch(0.6 0.13 130)",  icon: "📈", kind: "income" },
] as const;

export type Category = typeof CATEGORIES_INITIAL[number];

export function generateTransactions() {
  const out: any[] = [];
  const now = new Date(2026, 4, 1);
  const expenseCats = CATEGORIES_INITIAL.filter(c => c.kind === "expense");
  const incomeCats = CATEGORIES_INITIAL.filter(c => c.kind === "income");
  
  const notes: any = {
    food: ["MK Restaurants", "Starbucks สาขาเซ็นทรัล", "After You", "ข้าวมันไก่ตรงข้าม", "Tops Daily", "Grab Food — โจ๊กสมบูรณ์", "ก๋วยเตี๋ยวเรือ", "ร้านข้าวต้มกุ๊ย"],
    transit: ["BTS — สีลม → อโศก", "Grab → ออฟฟิศ", "เติมน้ำมัน PTT", "MRT 30 days", "Bolt", "Taxi"],
    shopping: ["Uniqlo Siam", "Lazada — ของใช้ในบ้าน", "Shopee", "IKEA", "Adidas Siam Center"],
    utility: ["MEA ค่าไฟ", "MWA ค่าน้ำ", "AIS Fibre", "Netflix", "Spotify Family", "True Mobile"],
    rent: ["ค่าเช่าคอนโด พ.ค. 2026"],
    travel: ["Bangkok Airways → CNX", "Booking.com — Hua Hin", "Klook ตั๋ว"],
    health: ["รพ. บำรุงราษฎร์", "ฟิตเนส Virgin", "ร้านขายยา"],
    ent: ["Major Cineplex", "Spotify", "PS Plus", "คอนเสิร์ต"],
    salary: ["เงินเดือนประจำเดือน"],
    freelance: ["โปรเจค UX — Acme Co.", "Logo design"],
    invest: ["เงินปันผล SCB", "ขายหุ้น"],
  };

  for (let m = 0; m < 6; m++) {
    const d = new Date(now); d.setMonth(d.getMonth() - m);
    out.push({ id: `s-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 28).toISOString(), amount: 65000 + Math.round(Math.random()*4000), categoryId: "salary", note: notes.salary[0] + ` — ${d.getMonth()+1}/${d.getFullYear()}`, account: "SCB Easy" });
    out.push({ id: `r-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(), amount: -18000, categoryId: "rent", note: notes.rent[0], account: "SCB Easy" });
    out.push({ id: `u1-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 5).toISOString(), amount: -(1200 + Math.round(Math.random()*600)), categoryId: "utility", note: "MEA ค่าไฟ", account: "SCB Easy" });
    out.push({ id: `u2-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 5).toISOString(), amount: -(380 + Math.round(Math.random()*120)), categoryId: "utility", note: "MWA ค่าน้ำ", account: "SCB Easy" });
    out.push({ id: `u3-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 12).toISOString(), amount: -899, categoryId: "utility", note: "AIS Fibre", account: "Kasikorn" });
    out.push({ id: `u4-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 14).toISOString(), amount: -419, categoryId: "ent", note: "Netflix", account: "Kasikorn" });
  }

  let tid = 0;
  for (let m = 0; m < 6; m++) {
    const d = new Date(now); d.setMonth(d.getMonth() - m);
    const days = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
    const count = m === 0 ? 18 : 12 + Math.round(Math.random()*8);
    for (let i = 0; i < count; i++) {
      const cat = expenseCats[Math.floor(Math.random()*expenseCats.length)];
      if (cat.id === "rent") continue;
      const day = Math.min(days, 1 + Math.floor(Math.random()*Math.min(days, m === 0 ? 28 : days)));
      const amt = -Math.round((cat.id === "shopping" ? 800 + Math.random()*4500 : cat.id === "travel" ? 2000 + Math.random()*9000 : cat.id === "health" ? 500 + Math.random()*3500 : 80 + Math.random()*900));
      const noteList = notes[cat.id] || ["—"];
      out.push({
        id: `t-${m}-${tid++}`,
        date: new Date(d.getFullYear(), d.getMonth(), day, 10 + Math.floor(Math.random()*10), Math.floor(Math.random()*60)).toISOString(),
        amount: amt,
        categoryId: cat.id,
        note: noteList[Math.floor(Math.random()*noteList.length)],
        account: Math.random() > 0.5 ? "SCB Easy" : "Kasikorn",
      });
    }
    if (Math.random() > 0.4) {
      out.push({ id: `f-${m}`, date: new Date(d.getFullYear(), d.getMonth(), 15 + Math.floor(Math.random()*10)).toISOString(), amount: 8000 + Math.round(Math.random()*15000), categoryId: "freelance", note: notes.freelance[Math.floor(Math.random()*notes.freelance.length)], account: "SCB Easy" });
    }
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const TRANSACTIONS_INITIAL = generateTransactions();

export const BUDGETS_INITIAL = [
  { id: "b-food",     categoryId: "food",     limit: 8000 },
  { id: "b-transit",  categoryId: "transit",  limit: 3500 },
  { id: "b-shopping", categoryId: "shopping", limit: 5000 },
  { id: "b-utility",  categoryId: "utility",  limit: 4000 },
  { id: "b-ent",      categoryId: "ent",      limit: 2500 },
  { id: "b-health",   categoryId: "health",   limit: 3000 },
];
