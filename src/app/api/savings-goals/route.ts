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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(mapGoal));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { nameTh, nameEn, icon, color, targetAmount, savedAmount, monthlyTarget, targetDate } = await request.json();
  if (!nameTh || !targetAmount) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const status = savedAmount >= targetAmount ? "completed" : "active";
  const { data, error } = await sb
    .from("savings_goals")
    .insert({
      user_id: userId,
      name_th: nameTh,
      name_en: nameEn || nameTh,
      icon: icon || "🎯",
      color: color || "oklch(0.55 0.18 270)",
      target_amount: targetAmount,
      saved_amount: savedAmount || 0,
      monthly_target: monthlyTarget || null,
      target_date: targetDate || null,
      status,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapGoal(data));
}
