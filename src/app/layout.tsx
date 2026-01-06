import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import MigrationChecker from "@/components/migration-checker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Pro - Admin Controlled Team CRM",
  description: "A professional CRM for teams with admin control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MigrationChecker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
