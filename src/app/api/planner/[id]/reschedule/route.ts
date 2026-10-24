import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { rescheduleOccurrence } from "@/lib/schedule/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: occurrenceId } = await params;
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    if (!body.newStartTime) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp giờ nhắc mới (newStartTime)." },
        { status: 400 }
      );
    }

    const result = await rescheduleOccurrence(user.id, occurrenceId, body.newStartTime);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi đổi giờ hoạt động";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
