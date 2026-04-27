import { NextResponse } from "next/server";
import { checkPassword, generateToken, COOKIE_NAME, SESSION_MAX_AGE_S } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Contrasena requerida" }, { status: 400 });
    }

    if (!checkPassword(password)) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ success: false, error: "Contrasena incorrecta" }, { status: 401 });
    }

    const token = generateToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_S,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 400 });
  }
}