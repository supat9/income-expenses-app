import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function mapDebt(r: any) {
  return {
    id: r.id,
    nameTh: r.name_th,
    nameEn: r.name_en,
    icon: r.icon,
    color: r.color,
    creditor: r.creditor,
    totalAmount: parseFloat(r.total_amount),
    paidAmount: parseFloat(r.paid_amount),
    monthlyPayment: r.monthly_payment ? parseFloat(r.monthly_payment) : null,
    interestRate: r.interest_rate ? parseFloat(r.interest_rate) : 0,
    dueDate: r.due_date,
    status: r.status,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(mapDebt));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { nameTh, nameEn, icon, color, creditor, totalAmount, paidAmount, monthlyPayment, interestRate, dueDate } = await request.json();
  if (!nameTh || !totalAmount) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const paid = paidAmount || 0;
  const status = paid >= totalAmount ? "paid" : "active";
  const { data, error } = await sb
    .from("debts")
    .insert({
      user_id: userId,
      name_th: nameTh,
      name_en: nameEn || nameTh,
      icon: icon || "💳",
      color: color || "oklch(0.6 0.19 25)",
      creditor: creditor || null,
      total_amount: totalAmount,
      paid_amount: paid,
      monthly_payment: monthlyPayment || null,
      interest_rate: interestRate || 0,
      due_date: dueDate || null,
      status,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapDebt(data));
}
