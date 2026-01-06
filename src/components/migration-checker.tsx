"use client";

import { useEffect, useState } from "react";

export default function MigrationChecker() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only check once
    if (checked) return;

    const checkMigration = async () => {
      try {
        const response = await fetch('/api/admin/migrate', {
          method: 'GET',
        });
        
        if (!response.ok) {
          console.warn('Migration check failed');
          return;
        }

        const data = await response.json();
        
        if (data.migrationNeeded) {
          console.log('Database migration may be needed. Please run add_phone_to_users.sql');
        }
      } catch (error) {
        console.warn('Migration check error:', error);
      } finally {
        setChecked(true);
      }
    };

    checkMigration();
  }, [checked]);

  return null; // This component doesn't render anything
}