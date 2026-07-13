"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from "@iconify/react";
import { Modal } from './Modal';
import { Button } from './Button';

export interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: string;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  title = "Inicia sesión para continuar",
  description = "Únete a la comunidad de AmazonIA para compartir tu experiencia y ayudar a otros a descubrir el arte de la selva.",
  icon = "lucide:user"
}: LoginPromptModalProps) {
  const router = useRouter();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-6 px-4">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon icon={icon} className="w-8 h-8 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          {description}
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            className="w-full h-12 text-base font-bold shadow-sm"
            onClick={() => router.push('/auth/login')}
          >
            Iniciar Sesión
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-bold"
            onClick={() => router.push('/auth/register')}
          >
            Crear Cuenta
          </Button>
        </div>
        <button 
          onClick={onClose}
          className="mt-6 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          Quizás más tarde
        </button>
      </div>
    </Modal>
  );
}
