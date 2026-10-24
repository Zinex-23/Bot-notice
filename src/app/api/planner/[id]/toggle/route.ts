import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { toggleTaskActive } from "@/lib/schedule/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const result = await toggleTaskActive(user.id, id, Boolean(body.isActive));
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi bật/tắt lịch nhắc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
