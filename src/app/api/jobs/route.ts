import { NextResponse } from 'next/server';
import staticJobs from '@/lib/jobs.json';

export async function GET() {
  try {
    // Deliver the bundled database via the API endpoint
    return NextResponse.json(staticJobs);
  } catch (error) {
    console.error("API Error serving bundled data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}
