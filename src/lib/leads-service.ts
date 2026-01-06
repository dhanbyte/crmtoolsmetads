import { supabase } from "./supabase";
import type { Lead } from "./supabase";

export type { Lead };

export const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
  const leadData: any = { ...lead };
  
  let { data, error } = await supabase
    .from("leads")
    .insert([leadData] as any)
    .select()
    .single();

  // Graceful fallback if city column is missing
  if (error && (error.message?.includes('column "city" of relation "leads" does not exist') || error.code === '42703')) {
    delete leadData.city;
    const retry = await supabase
      .from("leads")
      .insert([leadData] as any)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
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

  // Graceful fallback if city column is missing
  if (error && (error.message?.includes('column "city" of relation "leads" does not exist') || error.code === '42703')) {
    const safeLeads = leads.map(({ city, ...rest }: any) => rest);
    const retry = await supabase
      .from("leads")
      .insert(safeLeads as any)
      .select();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
};

