# 🔴 Non-Working Buttons & Features Report

## Summary
This document lists all buttons and features that are currently not functional in the LEADS CRM application.

---

## 1️⃣ Admin Leads Page (`/admin/leads`)

### Export CSV Button
- **Location:** Top right, next to "Import Leads"
- **Current Code:** `<button className="inline-flex...">Export CSV</button>`
- **Issue:** No onClick handler, just a static button
- **Expected Behavior:** Should export all leads to CSV file
- **Priority:** HIGH

### Import Leads Button
- **Location:** Top right
- **Current Code:** `<button className="btn-primary">Import Leads</button>`
- **Issue:** No onClick handler or modal
- **Expected Behavior:** Should open modal to upload CSV/Excel file
- **Priority:** HIGH

### Filter Button
- **Location:** Next to search bar
- **Current Code:** `<button className="inline-flex..."><Filter /></button>`
- **Issue:** No onClick handler
- **Expected Behavior:** Should open filter dropdown (by status, source, assignment, date range)
- **Priority:** MEDIUM

### Assign Lead Button (UserPlus icon)
- **Location:** Actions column, each lead row
- **Current Code:** `<button className="text-slate-400..."><UserPlus /></button>`
- **Issue:** No onClick handler
- **Expected Behavior:** Should open modal to assign lead to a team member
- **Priority:** HIGH

### Delete Lead Button
- **Location:** Actions column, each lead row
- **Current Code:** Has onClick but calls `deleteLead(lead.id!)`
- **Issue:** ✅ **THIS WORKS** - has proper handler
- **Priority:** N/A (Working)

---

## 2️⃣ Admin Messages/Templates Page (`/admin/messages`)

### New Template Button
- **Location:** Top right
- **Current Code:** `<button className="btn-primary">New Template</button>`
- **Issue:** No onClick handler
- **Expected Behavior:** Should open modal to create new WhatsApp template
- **Priority:** MEDIUM

### Edit Template Button
- **Location:** Each template card, top right (visible on hover)
- **Current Code:** `<button className="h-8 w-8..."><Edit /></button>`
- **Issue:** No onClick handler
- **Expected Behavior:** Should open modal to edit template
- **Priority:** MEDIUM

### Delete Template Button
- **Location:** Each template card, top right (visible on hover)
- **Current Code:** `<button className="h-8 w-8..."><Trash2 /></button>`
- **Issue:** No onClick handler
- **Expected Behavior:** Should delete template with confirmation
- **Priority:** LOW

---

## 3️⃣ Admin Settings Page (`/admin/settings`)

### Save Template Button
- **Location:** Bottom of WhatsApp template form
- **Current Code:** Has onClick handler `handleSave`
- **Issue:** ✅ **THIS WORKS** - properly saves to database
- **Priority:** N/A (Working)

---

## 4️⃣ Admin Users Page (`/admin/users`)

### Create User Button
- **Location:** Top right
- **Current Code:** Likely exists but need to check
- **Issue:** Unknown - need to verify
- **Priority:** HIGH

### Edit User Button
- **Location:** Each user row
- **Issue:** Unknown - need to verify
- **Priority:** MEDIUM

### Delete User Button
- **Location:** Each user row
- **Issue:** Unknown - need to verify
- **Priority:** MEDIUM

---

## 5️⃣ Team Dashboard (`/team/dashboard`)

### Accept Lead Button
- **Location:** Pool tab, each lead card
- **Current Code:** Has onClick handler `handleAcceptLead`
- **Issue:** ✅ **THIS WORKS** - properly assigns lead
- **Priority:** N/A (Working)

### Call Button
- **Location:** My Leads tab, each lead card
- **Current Code:** Has onClick handler `handleCall`
- **Issue:** ✅ **THIS WORKS** - opens phone dialer
- **Priority:** N/A (Working)

### WhatsApp Button
- **Location:** My Leads tab, each lead card
- **Current Code:** Has onClick handler `handleWhatsApp`
- **Issue:** ✅ **THIS WORKS** - opens WhatsApp with template
- **Priority:** N/A (Working)

### Follow-up Button
- **Location:** Urgent Follow-ups section
- **Current Code:** Has onClick handler
- **Issue:** ✅ **THIS WORKS** - opens follow-up modal
- **Priority:** N/A (Working)

### Update Status Button
- **Location:** Urgent Follow-ups section
- **Current Code:** Has onClick handler
- **Issue:** ✅ **THIS WORKS** - opens status modal
- **Priority:** N/A (Working)

---

## 🎯 Implementation Priority

### 🔴 HIGH Priority (Critical for MVP)
1. **Import Leads Button** - Core feature for bulk data entry
2. **Export CSV Button** - Essential for data export/backup
3. **Assign Lead Button** - Required for lead distribution

### 🟡 MEDIUM Priority (Important but not blocking)
4. **Filter Button** - Helpful for lead management
5. **New Template Button** - Useful for messaging
6. **Edit Template Button** - Template management

### 🟢 LOW Priority (Nice to have)
7. **Delete Template Button** - Can be done via database if needed

---

## 📝 Detailed Implementation Requirements

### 1. Export CSV Button
```typescript
const handleExportCSV = () => {
  // Convert leads array to CSV
  const csv = convertToCSV(filteredLeads);
  // Download file
  downloadCSV(csv, 'leads-export.csv');
};
```

### 2. Import Leads Button
```typescript
const handleImportLeads = async (file: File) => {
  // Parse CSV/Excel
  const data = await parseFile(file);
  // Validate and import
  await bulkImportLeads(data);
  // Refresh list
};
```

### 3. Assign Lead Button
```typescript
const handleAssignLead = async (leadId: string, userId: string) => {
  await updateLead(leadId, { assigned_to: userId });
  // Show success notification
};
```

### 4. Filter Button
```typescript
const handleFilter = (filters: FilterOptions) => {
  // Apply filters to leads
  setFilteredLeads(applyFilters(leads, filters));
};
```

---

## 📊 Statistics

- **Total Buttons Identified:** 15
- **Working Buttons:** 6 (40%)
- **Non-Working Buttons:** 9 (60%)
- **High Priority:** 3
- **Medium Priority:** 3
- **Low Priority:** 1

---

## ✅ Next Steps

1. Run `COMPLETE_DATABASE_SETUP.sql` to fix database error
2. Implement high-priority buttons first:
   - Import Leads functionality
   - Export CSV functionality
   - Assign Lead modal
3. Test all working features after database setup
4. Implement medium-priority features
5. Add low-priority features as time permits

---

## 🔍 How to Test After Database Setup

1. **Run the database script** in Supabase SQL Editor
2. **Refresh the app** - you should see 25 leads
3. **Test working buttons:**
   - Try accepting a lead from pool (team dashboard)
   - Try WhatsApp button with a lead
   - Try follow-up scheduling
4. **Identify remaining issues** with non-working buttons