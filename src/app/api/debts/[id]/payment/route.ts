import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getOrCreateDebtCategory(sb: any, userId: string): Promise<string> {
  const { data: existing } = await sb
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", "debt-payment")
    .single();

  if (existing?.id) return existing.id;

  const { data: created } = await sb
    .from("categories")
    .insert({
      user_id: userId,
      kind: "expense",
      name_th: "ชำระหนี้",
      name_en: "Debt Payment",
      color: "oklch(0.6 0.19 25)",
      icon: "💳",
      slug: "debt-payment",
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

  const { data: debt, error: debtErr } = await sb
    .from("debts")
    .select("paid_amount, total_amount, name_th, name_en")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (debtErr || !debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

  const newPaid = Math.min(parseFloat(debt.paid_amount) + amount, parseFloat(debt.total_amount));
  const newStatus = newPaid >= parseFloat(debt.total_amount) ? "paid" : "active";

  const { error: updateErr } = await sb
    .from("debts")
    .update({ paid_amount: newPaid, status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (withTransaction) {
    const categoryId = await getOrCreateDebtCategory(sb, userId);
    await sb.from("transactions").insert({
      user_id: userId,
      date: new Date().toISOString(),
      amount: -amount,
      category_id: categoryId,
      note: debt.name_th,
      account: "Cash",
    });
  }

  return NextResponse.json({ success: true, paidAmount: newPaid, status: newStatus });
}
