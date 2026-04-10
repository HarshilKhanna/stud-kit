import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const removeBgApiKey = process.env.REMOVE_BG_API_KEY;
    if (!removeBgApiKey) {
      return NextResponse.json({ error: "REMOVE_BG_API_KEY not configured in environment" }, { status: 500 });
    }

    // Prepare form data for remove.bg API
    const removeBgForm = new FormData();
    removeBgForm.append("image_file", file);
    removeBgForm.append("size", "auto"); // default option for standard background removal

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removeBgApiKey,
      },
      body: removeBgForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `remove.bg API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const outputBuffer = await response.arrayBuffer();

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    console.error("[remove-bg-proxy] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Background removal request failed" },
      { status: 500 },
    );
  }
}
