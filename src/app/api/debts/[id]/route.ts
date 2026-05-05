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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: any = { updated_at: new Date().toISOString() };
  if (body.nameTh !== undefined) updates.name_th = body.nameTh;
  if (body.nameEn !== undefined) updates.name_en = body.nameEn;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.color !== undefined) updates.color = body.color;
  if (body.creditor !== undefined) updates.creditor = body.creditor;
  if (body.totalAmount !== undefined) updates.total_amount = body.totalAmount;
  if (body.paidAmount !== undefined) updates.paid_amount = body.paidAmount;
  if (body.monthlyPayment !== undefined) updates.monthly_payment = body.monthlyPayment;
  if (body.interestRate !== undefined) updates.interest_rate = body.interestRate;
  if (body.dueDate !== undefined) updates.due_date = body.dueDate || null;

  if (updates.paid_amount !== undefined || updates.total_amount !== undefined) {
    const sb = getSupabaseAdmin();
    const { data: current } = await sb.from("debts").select("paid_amount, total_amount").eq("id", id).single();
    const paid = updates.paid_amount ?? parseFloat(current?.paid_amount ?? 0);
    const total = updates.total_amount ?? parseFloat(current?.total_amount ?? 0);
    updates.status = paid >= total ? "paid" : "active";
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("debts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapDebt(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("debts").delete().eq("id", id).eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
