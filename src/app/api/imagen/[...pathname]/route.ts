import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> }
) {
  try {
    await requireAuth();
  } catch {
    return new NextResponse("No autenticado", { status: 401 });
  }

  const { pathname } = await params;
  // pathname comes as segments like ["xxx.private.blob.vercel-storage.com", "filename.jpg"]
  // or just ["filename.jpg"] depending on how it was stored
  const blobPath = pathname.join("/");

  if (!blobPath) {
    return new NextResponse("Missing path", { status: 400 });
  }

  try {
    // Try to get the blob metadata first
    const result = await get(blobPath, { access: "private" });
    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    const blob = result.blob;
    // Fetch the actual blob content using the token
    const response = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok || !response.body) {
      return new NextResponse("Fetch failed", { status: 500 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[API imagen] Error:", error);
    return new NextResponse("Error fetching blob", { status: 500 });
  }
}