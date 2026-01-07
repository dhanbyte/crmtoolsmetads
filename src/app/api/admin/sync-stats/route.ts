import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function GET(req: NextRequest) {
  try {
    const syncService = new SyncService();
    
    const todayStats = await syncService.getTodayStats();
    const lastSyncTime = await syncService.getLastSyncTime();

    return NextResponse.json({ 
      success: true, 
      data: {
        todayStats,
        lastSyncTime,
      }
    });
  } catch (error: any) {
    console.error('Error fetching sync stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}