import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const syncService = new SyncService();
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const logs = await syncService.getSyncLogs(start, end);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}