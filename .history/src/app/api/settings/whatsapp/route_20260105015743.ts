import { NextRequest, NextResponse } from 'next/server';
import { getGlobalSettings, updateGlobalSettings } from '@/lib/dashboard-service';

export async function GET() {
  try {
    const template = await getGlobalSettings('whatsapp_template');
    return NextResponse.json(template || { message: 'Hello {name}, calling from CRM' });
  } catch (error) {
    console.error('Error fetching WhatsApp template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Missing message field' }, { status: 400 });
    }

    await updateGlobalSettings('whatsapp_template', { message });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating WhatsApp template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
