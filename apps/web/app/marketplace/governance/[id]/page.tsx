"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function OldGovernanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/governance/${id}`);
    } else {
      router.replace('/dashboard/governance');
    }
  }, [router, id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm">Redireccionando al detalle de la propuesta...</p>
      </div>
    </div>
  );
}
