import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getOrCreateSavingsCategory(sb: any, userId: string): Promise<string> {
  const { data: existing } = await sb
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", "saving")
    .single();

  if (existing?.id) return existing.id;

  const { data: created } = await sb
    .from("categories")
    .insert({
      user_id: userId,
      kind: "expense",
      name_th: "ออมเงิน",
      name_en: "Savings",
      color: "oklch(0.62 0.14 240)",
      icon: "🏦",
      slug: "saving",
    })
    .select("id")
    .single();

  return created.id;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const { amount, withTransaction } = await request.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const sb = getSupabaseAdmin();

  const { data: goal, error: goalErr } = await sb
    .from("savings_goals")
    .select("saved_amount, target_amount, name_th, name_en")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (goalErr || !goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const newSaved = parseFloat(goal.saved_amount) + amount;
  const newStatus = newSaved >= parseFloat(goal.target_amount) ? "completed" : "active";

  const { error: updateErr } = await sb
    .from("savings_goals")
    .update({ saved_amount: newSaved, status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (withTransaction) {
    const categoryId = await getOrCreateSavingsCategory(sb, userId);
    await sb.from("transactions").insert({
      user_id: userId,
      date: new Date().toISOString(),
      amount: -amount,
      category_id: categoryId,
      note: goal.name_th,
      account: "Cash",
    });
  }

  return NextResponse.json({ success: true, savedAmount: newSaved, status: newStatus });
}
