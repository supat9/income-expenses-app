import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const { th, en, color, icon } = await request.json();

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("categories")
    .update({ name_th: th, name_en: en, color, icon })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, kind, name_th, name_en, color, icon, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, th: data.name_th, en: data.name_en, color: data.color, icon: data.icon, kind: data.kind, slug: data.slug });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  if (!userId) return NextResponse.json({ error: "No user ID in session" }, { status: 401 });

  const { id } = await params;
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
