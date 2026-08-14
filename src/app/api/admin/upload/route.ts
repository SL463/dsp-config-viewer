import { NextResponse, type NextRequest } from "next/server";
import { ingestFile, IngestError } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — tunes are tiny; this is generous.

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 8 MB)." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const title = (form.get("title") as string | null) ?? undefined;
  const vehicle = (form.get("vehicle") as string | null) ?? undefined;
  const notes = (form.get("notes") as string | null) ?? undefined;

  try {
    const record = await ingestFile({
      filename: file.name || "upload",
      bytes,
      title: title ?? undefined,
      vehicle: vehicle ?? undefined,
      notes: notes ?? undefined,
    });
    return NextResponse.json({
      id: record.id,
      title: record.title,
      format: record.format,
    });
  } catch (e) {
    if (e instanceof IngestError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("upload failed", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
