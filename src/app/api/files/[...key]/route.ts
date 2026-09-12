import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contentTypeForKey, storage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serving stored files.
 *
 * Uploads are written outside anything the web server serves statically, so
 * this route is the only way back out. It requires a signed-in user and a
 * matching `Upload` row — a guessed or crafted path gets a 404, and directory
 * traversal is refused by the storage adapter before it touches the disk.
 *
 * NOTE on the authorisation model: any signed-in user may fetch any stored
 * key. Keys are server-generated UUIDs, so they aren't enumerable, but this is
 * deliberately not per-resource authorisation — a card image belonging to a
 * private set would be readable by someone who obtained its key. That is a
 * reasonable trade for revision material and avoids a join on every image
 * request. If images ever hold anything sensitive, tighten this to check the
 * owning card or question first.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    await requireUserId();

    const { key: segments } = await params;
    const key = segments.join("/");

    const upload = await db.upload.findFirst({
      where: { storageKey: key },
      select: { id: true, mimeType: true },
    });
    if (!upload) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const buffer = await storage().get(key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": upload.mimeType || contentTypeForKey(key),
        "content-length": String(buffer.byteLength),
        "content-disposition": "inline",
        // Never let a browser guess this is something executable.
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
        // Keys are unique per upload, so the bytes behind one never change.
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 404;
    if (status === 401) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
