"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldGovernancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/governance');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm">Redireccionando al panel de control...</p>
      </div>
    </div>
  );
}
