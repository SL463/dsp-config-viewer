import { NextResponse, type NextRequest } from "next/server";
import { getTune } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getTune(id);
  if (!record) {
    return NextResponse.json({ error: "Tune not found." }, { status: 404 });
  }
  const download = req.nextUrl.searchParams.get("download");
  const body = JSON.stringify(record.tune, null, 2);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (download) {
    headers["content-disposition"] = `attachment; filename="${id}.json"`;
  }
  return new NextResponse(body, { headers });
}
