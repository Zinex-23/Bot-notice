import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { completeTaskOccurrence } from "@/lib/schedule/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: occurrenceId } = await params;
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json().catch(() => ({}));

    const result = await completeTaskOccurrence(
      user.id,
      occurrenceId,
      body.value,
      "WEB"
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi đánh dấu hoàn thành";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
