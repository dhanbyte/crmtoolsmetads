
import { supabase } from "./supabase";
import type { Lead, Activity } from "./supabase";

export interface DashboardStats {
  myLeads: number;
  todaysTasks: number;
  callsMade: number;
  converted: number;
}

export const getTeamDashboardStats = async (userId: string): Promise<DashboardStats> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 1. My Leads count
  const { count: myLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId);

  // 2. Today's Tasks
  const { count: todaysFollowUps } = await supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId)
    .lte("next_follow_up", todayEnd.toISOString());

  // 3. Calls Made (Today)
  const { count: callsMade } = await supabase
    .from("activities")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("type", "call")
    .gte("created_at", todayStart.toISOString())
    .lte("created_at", todayEnd.toISOString());

  // 4. Converted
  const { count: converted } = await supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId)
    .eq("status", "converted");

  // Check if we found any data, otherwise return mock data for "features showcase" mode
  const hasData = (myLeads || 0) > 0 || (todaysFollowUps || 0) > 0 || (callsMade || 0) > 0 || (converted || 0) > 0;

  if (!hasData) {
    // Mock data for feature showcase
    return {
       myLeads: 84,
       todaysTasks: 12,
       callsMade: 32,
       converted: 4
    };
  }

  return {
    myLeads: myLeads || 0,
    todaysTasks: todaysFollowUps || 0,
    callsMade: callsMade || 0,
    converted: converted || 0,
  };
};

export const getUrgentFollowUps = async (userId: string) => {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", userId)
    .lte("next_follow_up", todayEnd.toISOString())
    .order("next_follow_up", { ascending: true })
    .limit(10); // Limit to 10 urgent ones

  if (error) throw error;
  if (!data || data.length === 0) {
    // Mock Urgent Follow-ups for showcase
    const now = new Date();
    return [
      {
        id: "mock-1",
        name: "Rahul Sharma",
        phone: "+91 9876543210",
        next_follow_up: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        status: "qualified",
        email: "rahul@example.com",
        source: "Website",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        assigned_to: userId
      },
      {
         id: "mock-2",
         name: "Priya Patel",
         phone: "+91 8765432109",
         next_follow_up: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
         status: "contacted",
         email: "priya@example.com",
         source: "Facebook",
         created_at: now.toISOString(),
         updated_at: now.toISOString(),
         assigned_to: userId
      },
      {
         id: "mock-3",
         name: "Amit Kumar",
         phone: "+91 7654321098",
         next_follow_up: new Date(now.getTime() + 1000 * 60 * 15).toISOString(),
         status: "new",
         email: "amit@example.com",
         source: "Referral",
         created_at: now.toISOString(),
         updated_at: now.toISOString(),
         assigned_to: userId
      }
    ] as Lead[];
  }

  return data as Lead[];
};

export const logActivity = async (userId: string, leadId: string, type: Activity['type'], details?: string) => {
  if (leadId.startsWith('mock-')) return;

  const { error } = await supabase
    .from("activities")
    .insert([{
      user_id: userId,
      lead_id: leadId,
      type,
      details
    }]);

  if (!error) {
    const updates: any = {
      last_activity_type: type,
      updated_at: new Date().toISOString()
    };
    
    if (type === 'call' || type === 'whatsapp') {
       updates.last_contacted_at = new Date().toISOString();
    }

    await supabase.from('leads').update(updates).eq('id', leadId);
  }

  if (error) throw error;
};

// New Function: Update Lead Status
export const updateLeadStatus = async (userId: string, leadId: string, status: Lead['status'], nextFollowUp?: string) => {
  // If this is a mock lead, simulate success without hitting the DB
  if (leadId.startsWith('mock-')) {
    console.log(`[Mock Mode] Status updated to ${status} for lead ${leadId}`);
    return;
  }

  const updates: any = {
    status: status,
    updated_at: new Date().toISOString()
  };

  if (nextFollowUp) {
    updates.next_follow_up = nextFollowUp;
  }

  try {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId);

    if (error) throw error;
    
    // Log the status change activity
    await logActivity(userId, leadId, 'status_change', `Status updated to ${status}`);
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;

  }
};

// New Function: Accept Lead
export const acceptLead = async (userId: string, leadId: string) => {
  const { error } = await supabase
    .from('leads')
    .update({ 
      assigned_to: userId,
      updated_at: new Date().toISOString(),
      status: 'contacted' // Move to contacted once accepted
    })
    .eq('id', leadId)
    .is('assigned_to', null); // Only if not already assigned

  if (error) throw error;
  
  await logActivity(userId, leadId, 'status_change', 'Lead accepted and assigned');
};

// New Function: Update Follow-up
export const updateLeadFollowUp = async (userId: string, leadId: string, nextFollowUp: string, notes: string) => {
  const { error } = await supabase
    .from('leads')
    .update({
      next_follow_up: nextFollowUp,
      follow_up_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);

  if (error) throw error;
  
  await logActivity(userId, leadId, 'note', `Scheduled follow-up: ${notes}`);
};

// New Function: Get Pool Leads
export const getAvailablePoolLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .is('assigned_to', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
};

// New Function: Global Settings
export const getGlobalSettings = async (key: string) => {
  const { data, error } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.value || null;
};

export const updateGlobalSettings = async (key: string, value: any) => {
  const { error } = await supabase
    .from('global_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw error;
};
