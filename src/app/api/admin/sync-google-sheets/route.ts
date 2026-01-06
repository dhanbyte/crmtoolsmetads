import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets-service';

export async function POST(req: NextRequest) {
  try {
    // Check if Google Sheets credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Sheets integration not configured. Please add credentials to environment variables.' 
        },
        { status: 400 }
      );
    }

    const service = new GoogleSheetsService();
    const result = await service.syncLeadsToDatabase();

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${result.imported} imported, ${result.updated} updated, ${result.errors} errors`,
      data: result,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync leads from Google Sheets' 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if Google Sheets credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({
        configured: false,
        message: 'Google Sheets integration not configured',
      });
    }

    const service = new GoogleSheetsService();
    const leads = await service.fetchLeadsFromSheet();

    return NextResponse.json({
      configured: true,
      leadCount: leads.length,
      message: `Found ${leads.length} leads in Google Sheet`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        configured: true,
        error: error.message 
      },
      { status: 500 }
    );
  }
}