import { NextResponse, type NextRequest } from "next/server";
import { deleteTune, getTune } from "@/lib/storage";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await getTune(id);
  if (!existing) {
    return NextResponse.json({ error: "Tune not found." }, { status: 404 });
  }
  try {
    await deleteTune(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delete failed", e);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
