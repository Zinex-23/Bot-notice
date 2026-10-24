import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, getOrCreatePrimaryUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = body.pin?.toString().trim();

    const expectedPin = process.env.ADMIN_PIN || "123456";

    if (!pin || pin !== expectedPin) {
      return NextResponse.json(
        { error: "Mã PIN không chính xác. Vui lòng thử lại." },
        { status: 401 }
      );
    }

    const user = await getOrCreatePrimaryUser();
    const token = await createSessionToken(user.id);

    const cookieStore = await cookies();
    cookieStore.set("dailyflow_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
