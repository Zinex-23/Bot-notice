import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreatePrimaryUser } from "@/lib/auth/session";
import { deleteScheduleItem, updateScheduleItem } from "@/lib/schedule/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());
    const body = await request.json();

    const task = await updateScheduleItem(user.id, id, body);
    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi cập nhật lịch nhắc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = (await getCurrentUser()) || (await getOrCreatePrimaryUser());

    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") as "THIS_OCCURRENCE" | "ALL") || "ALL";
    const occurrenceId = searchParams.get("occurrenceId") || undefined;

    const result = await deleteScheduleItem(user.id, id, scope, occurrenceId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xóa lịch nhắc";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
