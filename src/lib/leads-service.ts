import { supabase } from "./supabase";
import type { Lead } from "./supabase";

export type { Lead };

const getSafeLeadData = (data: any, columnsToExclude: string[]) => {
  const safeData = { ...data };
  columnsToExclude.forEach(col => delete safeData[col]);
  return safeData;
};

// Auto-extract column name from error message (e.g., 'column "interest" does not exist')
const extractColumnName = (message: string): string | null => {
  const match = message.match(/column "(.+?)"/i);
  return match ? match[1] : null;
};

export const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
  const leadData: any = { ...lead };
  
  const { data, error } = await supabase
    .from("leads")
    .insert([leadData] as any)
    .select()
    .single();

  if (error) {
    const errorMsg = error.message || "";
    const isSchemaError = errorMsg.includes('does not exist') || errorMsg.includes('schema cache') || error.code === '42703';
    
    if (isSchemaError) {
      const missingCol = extractColumnName(errorMsg);
      if (missingCol) {
        console.warn(`Self-Healing: Retrying without '${missingCol}' due to schema mismatch.`);
        const safeData = getSafeLeadData(leadData, [missingCol]);
        const retry = await supabase
          .from("leads")
          .insert([safeData] as any)
          .select()
          .single();
        
        if (retry.error) {
           // If it still fails with another column, try one more time with only absolute base columns
           const baseCols = ['name', 'email', 'phone', 'status', 'source', 'assigned_to'];
           const ultraSafeData: any = {};
           baseCols.forEach(c => { if(leadData[c]) ultraSafeData[c] = leadData[c] });
           const lastResort = await supabase.from("leads").insert([ultraSafeData] as any).select().single();
           if (lastResort.error) throw lastResort.error;
           return lastResort.data;
        }
        return retry.data;
      }
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
  const { data, error } = await supabase
    .from("leads")
    .insert(leads as any)
    .select();

  if (error) {
    const errorMsg = error.message || "";
    const isSchemaError = errorMsg.includes('does not exist') || errorMsg.includes('schema cache') || error.code === '42703';
    
    if (isSchemaError) {
      const missingCol = extractColumnName(errorMsg);
      if (missingCol) {
        console.warn(`Self-Healing (Bulk): Retrying without '${missingCol}' due to schema mismatch.`);
        const safeLeads = leads.map((lead) => getSafeLeadData(lead, [missingCol]));
        const retry = await supabase
          .from("leads")
          .insert(safeLeads as any)
          .select();
        
        if (retry.error) {
           const baseCols = ['name', 'email', 'phone', 'status', 'source', 'assigned_to'];
           const ultraSafeLeads = leads.map(leadData => {
             const ultraSafeData: any = {};
             baseCols.forEach(c => { if((leadData as any)[c]) ultraSafeData[c] = (leadData as any)[c] });
             return ultraSafeData;
           });
           const lastResort = await supabase.from("leads").insert(ultraSafeLeads as any).select();
           if (lastResort.error) throw lastResort.error;
           return lastResort.data;
        }
        return retry.data;
      }
    }
    throw error;
  }

  return data;
};

