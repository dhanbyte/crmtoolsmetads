# 📱 Phone Login Setup Guide

## Current Status

**Phone column doesn't exist in database**, so we're using **hardcoded phone-to-email mapping** in the code.

## How It Works Now

1. User enters phone number
2. Code checks hardcoded mapping in `src/lib/auth-context.tsx`
3. If phone found, uses mapped email + password to login
4. If not in mapping, tries all users with phone as password

## Adding New Users

### Method 1: Add to Hardcoded Map (QUICK)

Edit `src/lib/auth-context.tsx` and add to `phoneToEmailMap`:

```typescript
const phoneToEmailMap: Record<string, { email: string; password: string }> = {
  '9157499884': { email: 'admin@crmpro.com', password: '704331' },
  '9876543210': { email: 'team1@crmpro.com', password: '9876543210' },  // ADD THIS
  '9876543211': { email: 'team2@crmpro.com', password: '9876543211' },  // ADD THIS
};
```

### Method 2: Check Database Users

Run in Supabase SQL Editor:
```sql
-- See all users
SELECT id, name, email, role FROM users;
```

Then for each user, add their phone to the mapping above.

## Current Working Logins

✅ **Admin**: Phone `9157499884` → admin@crmpro.com  
⚠️ **Team**: Add phone mappings as shown above

## Testing

1. Add team member phone to mapping
2. Restart dev server (or hot reload)
3. Login with that phone number
4. Should work!

---

## Future: Proper Database Fix

When ready to fix properly:
```sql
ALTER TABLE users ADD COLUMN phone TEXT;
UPDATE users SET phone = '9157499884' WHERE email = 'admin@crmpro.com';
-- Update other users...
```

Then remove hardcoded mapping from code.