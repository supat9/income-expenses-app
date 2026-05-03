import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { categoryId, limit } = await request.json();
  if (!categoryId || !limit) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("budgets")
    .insert({ user_id: userId, category_id: categoryId, limit })
    .select("id, category_id, limit")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, categoryId: data.category_id, limit: parseFloat(data.limit) });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("budgets")
    .select("id, category_id, limit")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map(b => ({ id: b.id, categoryId: b.category_id, limit: parseFloat(b.limit) }))
  );
}
