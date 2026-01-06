# 🔴 Current Non-Working Features & Buttons List

Based on the latest codebase research, here are the features and buttons that are currently NOT functional:

### 1. Admin - Leads Page (`/admin/leads`)
- **Export CSV Button**: Static button, no export logic yet.
- **Import Leads Button**: Static button, no import logic/modal yet.
- **Filter Button**: Static button, no filter dropdown yet.
- **Assign Lead Button** (User icon in table): Static icon, no assignment modal yet.

### 2. Admin - Message Templates (`/admin/messages`)
- **New Template Button**: No creation modal yet.
- **Edit Template Button**: No edit functionality yet.
- **Delete Template Button**: No delete functionality yet.

### 3. Admin - User Management (`/admin/users`)
- **Edit User**: No edit button or modal available in the list.
- **Delete User**: No delete functionality available in the list.
- **More Actions Menu**: The "More" icon at the end of user rows has no click handler.

### 4. Team Dashboard (`/team/dashboard`)
- **Update Status Button**: While the backend service exists, the button itself is missing from the "Urgent Follow-ups" section in the UI.
- **More Actions Menu** (on Lead Cards): The "More" icon has no menu or handler.

---

### ✅ Features That ARE Working:
- **Lead Pool**: Team members can see and "Accept" leads.
- **My Leads**: Shows assigned leads and urgent follow-ups.
- **WhatsApp Integration**: Opens WhatsApp with pre-filled templates.
- **One-Click Calling**: Opens the phone dialer.
- **Follow-up Scheduling**: Can set date/time and notes for leads.
- **User Creation**: The "Add New User" button in Admin is connected to a creation API.
- **User Status Toggle**: Can toggle users between Active and Inactive.
- **Delete Lead**: Admins can delete leads from the main list.
- **WhatsApp Template Settings**: Admins can edit and save the global message template.
