import { supabase } from "./supabase";
import type { Lead } from "./supabase";

export type { Lead };

const getSafeLeadData = (data: any, columnsToExclude: string[]) => {
  const safeData = { ...data };
  columnsToExclude.forEach(col => delete safeData[col]);
  return safeData;
};

export const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
  const leadData: any = { ...lead };
  
  const { data, error } = await supabase
    .from("leads")
    .insert([leadData] as any)
    .select()
    .single();

  if (error) {
    const errorMsg = error.message?.toLowerCase() || "";
    // Handle both direct missing column errors and schema cache errors
    if (
      errorMsg.includes('column "city" does not exist') || 
      errorMsg.includes('city') && errorMsg.includes('schema cache') ||
      error.code === '42703'
    ) {
      console.warn("Retrying lead insertion without 'city' column due to schema error");
      const safeData = getSafeLeadData(leadData, ['city']);
      const retry = await supabase
        .from("leads")
        .insert([safeData] as any)
        .select()
        .single();
      
      if (retry.error) throw retry.error;
      return retry.data;
    }
    throw error;
  }

  return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>) => {
  const { data, error } = await supabase
    .from("leads")
    .update(updates as any as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
};

export const getLeadsByAgent = (agentId: string, callback: (leads: Lead[]) => void) => {
  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("assigned_to", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      return;
    }
    
    if (data) callback(data);
  };

  fetchLeads();

  const channel = supabase
    .channel(`agent-leads-${agentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `assigned_to=eq.${agentId}`,
      },
      () => fetchLeads()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getAllLeads = (callback: (leads: Lead[]) => void) => {
  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      return;
    }
    
    if (data) callback(data);
  };

  fetchLeads();

  const channel = supabase
    .channel('all-leads')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
      },
      () => fetchLeads()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const bulkImportLeads = async (leads: Omit<Lead, "id" | "created_at" | "updated_at">[]) => {
  let { data, error } = await supabase
    .from("leads")
    .insert(leads as any)
    .select();

  if (error) {
    const errorMsg = error.message?.toLowerCase() || "";
    if (
      errorMsg.includes('column "city" does not exist') || 
      errorMsg.includes('city') && errorMsg.includes('schema cache') ||
      error.code === '42703'
    ) {
      console.warn("Retrying bulk import without 'city' column due to schema error");
      const safeLeads = leads.map((lead) => getSafeLeadData(lead, ['city']));
      const retry = await supabase
        .from("leads")
        .insert(safeLeads as any)
        .select();
      
      if (retry.error) throw retry.error;
      return retry.data;
    }
    throw error;
  }

  return data;
};

