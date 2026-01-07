import { createClient } from '@supabase/supabase-js';
import { GoogleSheetsService } from './google-sheets-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create untyped client for sync_logs operations
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface SyncResult {
  id: string;
  imported: number;
  updated: number;
  errors: number;
  total: number;
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
}

export class SyncService {
  async performSync(syncType: 'manual' | 'auto' = 'manual'): Promise<SyncResult> {
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabaseClient
      .from('sync_logs')
      .insert({
        sync_started_at: new Date().toISOString(),
        status: 'running',
        sync_type: syncType,
        imported_count: 0,
        updated_count: 0,
        error_count: 0,
        total_processed: 0,
      })
      .select()
      .single();

    if (logError || !syncLog) {
      console.error('Failed to create sync log:', logError);
      throw new Error('Failed to initialize sync');
    }

    const logId = (syncLog as any).id;

    try {
      // Perform the actual sync
      const service = new GoogleSheetsService();
      const result = await service.syncLeadsToDatabase();

      const total = result.imported + result.updated + result.errors;
      const status = result.errors === 0 ? 'success' : result.errors === total ? 'failed' : 'partial';

      // Update sync log with results
      await supabaseClient
        .from('sync_logs')
        .update({
          sync_completed_at: new Date().toISOString(),
          imported_count: result.imported,
          updated_count: result.updated,
          error_count: result.errors,
          total_processed: total,
          status,
        })
        .eq('id', logId);

      return {
        id: logId,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        total,
        status,
      };
    } catch (error: any) {
      // Update sync log with error
      await supabaseClient
        .from('sync_logs')
        .update({
          sync_completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', logId);

      return {
        id: logId,
        imported: 0,
        updated: 0,
        errors: 1,
        total: 1,
        status: 'failed',
        errorMessage: error.message,
      };
    }
  }

  async getSyncLogs(startDate?: Date, endDate?: Date) {
    let query = supabaseClient
      .from('sync_logs')
      .select('*')
      .order('sync_started_at', { ascending: false });

    if (startDate) {
      query = query.gte('sync_started_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('sync_started_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sync logs:', error);
      throw error;
    }

    return data || [];
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseClient
      .from('sync_logs')
      .select('*')
      .gte('sync_started_at', today.toISOString());

    if (error) {
      console.error('Error fetching today stats:', error);
      return {
        totalSyncs: 0,
        totalImported: 0,
        totalUpdated: 0,
        successRate: 0,
      };
    }

    const totalSyncs = data?.length || 0;
    const totalImported = data?.reduce((sum, log) => sum + ((log as any).imported_count || 0), 0) || 0;
    const totalUpdated = data?.reduce((sum, log) => sum + ((log as any).updated_count || 0), 0) || 0;
    const successCount = data?.filter((log) => (log as any).status === 'success').length || 0;
    const successRate = totalSyncs > 0 ? (successCount / totalSyncs) * 100 : 0;

    return {
      totalSyncs,
      totalImported,
      totalUpdated,
      successRate,
    };
  }

  async getLastSyncTime() {
    const { data, error } = await supabaseClient
      .from('sync_logs')
      .select('sync_completed_at')
      .order('sync_completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return (data as any).sync_completed_at;
  }
}