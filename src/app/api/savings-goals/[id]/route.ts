import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function mapGoal(r: any) {
  return {
    id: r.id,
    nameTh: r.name_th,
    nameEn: r.name_en,
    icon: r.icon,
    color: r.color,
    targetAmount: parseFloat(r.target_amount),
    savedAmount: parseFloat(r.saved_amount),
    monthlyTarget: r.monthly_target ? parseFloat(r.monthly_target) : null,
    targetDate: r.target_date,
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
  if (body.targetAmount !== undefined) updates.target_amount = body.targetAmount;
  if (body.savedAmount !== undefined) updates.saved_amount = body.savedAmount;
  if (body.monthlyTarget !== undefined) updates.monthly_target = body.monthlyTarget;
  if (body.targetDate !== undefined) updates.target_date = body.targetDate || null;

  if (updates.saved_amount !== undefined || updates.target_amount !== undefined) {
    const sb = getSupabaseAdmin();
    const { data: current } = await sb.from("savings_goals").select("saved_amount, target_amount").eq("id", id).single();
    const saved = updates.saved_amount ?? parseFloat(current?.saved_amount ?? 0);
    const target = updates.target_amount ?? parseFloat(current?.target_amount ?? 0);
    updates.status = saved >= target ? "completed" : "active";
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("savings_goals")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapGoal(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("savings_goals").delete().eq("id", id).eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
