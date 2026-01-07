import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';

export async function GET(req: NextRequest) {
  try {
    // Check if Google Sheets credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Sheets integration not configured' 
        },
        { status: 400 }
      );
    }

    // Perform auto-sync
    const syncService = new SyncService();
    const result = await syncService.performSync('auto');

    return NextResponse.json({
      success: true,
      message: `Auto-sync completed: ${result.imported} imported, ${result.updated} updated, ${result.errors} errors`,
      data: result,
    });
  } catch (error: any) {
    console.error('Auto-sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Auto-sync failed' 
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req);
}