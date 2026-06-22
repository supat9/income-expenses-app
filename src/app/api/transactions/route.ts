import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const sb = getSupabaseAdmin();
  let q: any = sb
    .from("transactions")
    .select("id, date, amount, category_id, note, account")
    .eq("user_id", userId);

  // Support explicit date range via `from` and `to` query params (YYYY-MM-DD or full ISO).
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  if (fromParam || toParam) {
    if (fromParam) {
      const fromIso = /^\d{4}-\d{2}-\d{2}$/.test(fromParam)
        ? new Date(fromParam + "T00:00:00Z").toISOString()
        : new Date(fromParam).toISOString();
      q = q.gte("date", fromIso);
    }
    if (toParam) {
      const toIso = /^\d{4}-\d{2}-\d{2}$/.test(toParam)
        ? new Date(toParam + "T23:59:59Z").toISOString()
        : new Date(toParam).toISOString();
      q = q.lte("date", toIso);
    }
  } else {
    const months = Math.max(1, parseInt(searchParams.get("months") ?? "6"));
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    q = q.gte("date", since.toISOString());
  }

  const { data, error } = await q.order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map(tx => ({
      id: tx.id,
      date: tx.date,
      amount: parseFloat(tx.amount),
      categoryId: tx.category_id,
      note: tx.note ?? "",
      account: tx.account ?? "Cash",
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const body = await request.json();
  const { date, amount, categoryId, note, account } = body;

  if (!date || amount == null || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("transactions")
    .insert({ user_id: userId, date, amount, category_id: categoryId, note: note || null, account: account || "Cash" })
    .select("id, date, amount, category_id, note, account")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    date: data.date,
    amount: parseFloat(data.amount),
    categoryId: data.category_id,
    note: data.note ?? "",
    account: data.account ?? "Cash",
  });
}
