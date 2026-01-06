# 🔐 CRM Pro - Admin Account Setup Guide

## ⚡ Quick Setup (2 Minutes)

### Option 1: Enable Firebase Authentication (Recommended)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: **crmpro-5559e**

2. **Enable Authentication**
   - Click on "Authentication" in the left sidebar
   - Click "Get Started" button
   - Click on "Email/Password" under Sign-in method
   - Toggle "Email/Password" to **Enabled**
   - Click "Save"

3. **Create Admin User**
   - Stay in Firebase Console → Authentication → Users tab
   - Click "Add User" button
   - Enter:
     - **Email:** `admin@crmpro.com`
     - **Password:** `admin123`
   - Click "Add User"

4. **Login to CRM**
   - Open: http://localhost:3000/login
   - Use credentials:
     - Email: `admin@crmpro.com`
     - Password: `admin123`

---

### Option 2: Use Script (After Enabling Authentication)

Once Authentication is enabled in Firebase Console:

```bash
# Run this command in your terminal
node scripts/create-admin.js
```

This will automatically create the admin user with:
- Email: `admin@crmpro.com`
- Password: `admin123`

---

## 🔑 Default Login Credentials

```
Email:    admin@crmpro.com
Password: admin123
```

---

## 📝 Step-by-Step with Screenshots

### Step 1: Firebase Console
![Firebase Console](https://console.firebase.google.com/)

### Step 2: Authentication Setup
1. Click "Authentication" (left sidebar)
2. Click "Get Started"
3. Select "Email/Password"
4. Enable it
5. Save

### Step 3: Add User
1. Go to "Users" tab
2. Click "Add User"
3. Enter email: `admin@crmpro.com`
4. Enter password: `admin123`
5. Click "Add User"

### Step 4: Login
1. Open: http://localhost:3000/login
2. Enter credentials
3. Click "Sign In"

---

## ❓ Troubleshooting

### "Invalid email or password"
- Make sure you created the user in Firebase Console
- Check that Authentication is enabled
- Verify you're using the correct credentials

### "CONFIGURATION_NOT_FOUND"
- Firebase Authentication is not enabled
- Follow Option 1 above to enable it

### Port 3000 in use
```bash
Stop-Process -Name node -Force
npm run dev
```

---

## 🎯 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/crmpro-5559e
- **Login Page:** http://localhost:3000/login
- **Setup Page:** http://localhost:3000/setup

---

## 📞 Need Help?

If you're still having issues, let me know and I'll help you troubleshoot!
