import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const DEFAULT_CATEGORIES = [
  { kind: "expense", name_th: "อาหาร",     name_en: "Food & dining",  color: "oklch(0.65 0.16 35)",  icon: "🍜", slug: "food" },
  { kind: "expense", name_th: "เดินทาง",   name_en: "Transport",       color: "oklch(0.62 0.14 240)", icon: "🚇", slug: "transit" },
  { kind: "expense", name_th: "ช้อปปิ้ง",  name_en: "Shopping",        color: "oklch(0.65 0.16 320)", icon: "🛍️", slug: "shopping" },
  { kind: "expense", name_th: "ยูทิลิตี้",  name_en: "Utilities",       color: "oklch(0.65 0.13 195)", icon: "💡", slug: "utility" },
  { kind: "expense", name_th: "ค่าเช่า",   name_en: "Rent / housing",  color: "oklch(0.55 0.14 280)", icon: "🏠", slug: "rent" },
  { kind: "expense", name_th: "ท่องเที่ยว",name_en: "Travel",          color: "oklch(0.7 0.14 145)",  icon: "✈️", slug: "travel" },
  { kind: "expense", name_th: "สุขภาพ",   name_en: "Health",          color: "oklch(0.6 0.16 10)",   icon: "🩺", slug: "health" },
  { kind: "expense", name_th: "บันเทิง",   name_en: "Entertainment",   color: "oklch(0.65 0.15 295)", icon: "🎬", slug: "ent" },
  { kind: "income",  name_th: "เงินเดือน", name_en: "Salary",          color: "oklch(0.6 0.13 158)",  icon: "💼", slug: "salary" },
  { kind: "income",  name_th: "ฟรีแลนซ์", name_en: "Freelance",       color: "oklch(0.65 0.13 175)", icon: "💻", slug: "freelance" },
  { kind: "income",  name_th: "ลงทุน",    name_en: "Investments",     color: "oklch(0.6 0.13 130)",  icon: "📈", slug: "invest" },
];

const DEFAULT_BUDGET_SLUGS = [
  { slug: "food",     limit: 8000 },
  { slug: "transit",  limit: 3500 },
  { slug: "shopping", limit: 5000 },
  { slug: "utility",  limit: 4000 },
  { slug: "ent",      limit: 2500 },
  { slug: "health",   limit: 3000 },
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { kind, th, en, color, icon } = await request.json();
  if (!kind || !th || !en || !color || !icon) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("categories")
    .insert({ user_id: userId, kind, name_th: th, name_en: en, color, icon })
    .select("id, kind, name_th, name_en, color, icon, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, th: data.name_th, en: data.name_en, color: data.color, icon: data.icon, kind: data.kind, slug: data.slug });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const sb = getSupabaseAdmin();

  const { data: existing } = await sb
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (!existing?.length) {
    await sb.from("categories").insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }))
    );

    const { data: seeded } = await sb
      .from("categories")
      .select("id, slug")
      .eq("user_id", userId);

    if (seeded?.length) {
      const budgetRows = DEFAULT_BUDGET_SLUGS
        .map(b => {
          const cat = seeded.find(c => c.slug === b.slug);
          return cat ? { user_id: userId, category_id: cat.id, limit: b.limit } : null;
        })
        .filter(Boolean);
      if (budgetRows.length) await sb.from("budgets").insert(budgetRows);
    }
  }

  const { data, error } = await sb
    .from("categories")
    .select("id, kind, name_th, name_en, color, icon, slug")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map(c => ({ id: c.id, th: c.name_th, en: c.name_en, color: c.color, icon: c.icon, kind: c.kind, slug: c.slug }))
  );
}
