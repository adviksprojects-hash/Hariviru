import { NextResponse } from "next/server";
import { processDailyCelebrationReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // 1. Verify cron secret if configured in environment
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const { searchParams } = new URL(request.url);
      const key = searchParams.get("key");
      if (key !== cronSecret) {
        return NextResponse.json(
          { error: "Unauthorized access to cron trigger" },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const dryRun = searchParams.get("dryRun") === "true";
    const simulatedDate = searchParams.get("date") || null;

    console.log(
      `[Cron /api/cron/reminders] Executing 9:00 AM reminder job at ${new Date().toISOString()} (force: ${force})`
    );

    const result = await processDailyCelebrationReminders({
      forceRun: force,
      dryRun,
      simulatedDate,
    });

    return NextResponse.json({
      success: true,
      job: "celebration_reminders_9am",
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("[Cron /api/cron/reminders Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
