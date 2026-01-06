# CRM Pro - Admin Controlled Team CRM

A Next.js-based CRM application with Firebase authentication and Firestore database.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 3. Initial Setup

**First Time Setup:**

1. Navigate to [http://localhost:3000/setup](http://localhost:3000/setup)
2. Create your first admin account using the setup page
3. Default credentials are pre-filled (you can modify them):
   - **Email:** `admin@crmpro.com`
   - **Password:** `admin123`

### 4. Login

After creating your account:

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Use the credentials you created in the setup page

## 🔑 Default Credentials

**Admin Account:**
- Email: `admin@crmpro.com`
- Password: `admin123`

> **Note:** These are the default credentials. You can change them during the initial setup.

## 📁 Project Structure

```
LEADS/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── setup/          # Initial setup page
│   │   └── team/           # Team member dashboard
│   ├── components/         # Reusable components
│   └── lib/
│       ├── firebase.ts     # Firebase client config
│       └── firebase-admin.ts # Firebase admin SDK
└── package.json
```

## 🛠️ Technologies Used

- **Framework:** Next.js 16.1.1 with Turbopack
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore
- **Styling:** Tailwind CSS v4
- **UI Components:** Lucide React Icons
- **Animations:** Framer Motion

## 🔧 Troubleshooting

### Port Already in Use

If you see "Port 3000 is in use", kill existing Node processes:

```bash
# Windows PowerShell
Stop-Process -Name node -Force
```

Then restart the dev server:

```bash
npm run dev
```

### Lock File Error

If you see "Unable to acquire lock at .next/dev/lock":

```bash
# Remove .next directory
Remove-Item -Path ".next" -Recurse -Force

# Restart dev server
npm run dev
```

### Cannot Login

1. Make sure you've completed the initial setup at `/setup`
2. Verify your Firebase configuration in `src/lib/firebase.ts`
3. Check that Firebase Authentication is enabled in your Firebase Console

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
