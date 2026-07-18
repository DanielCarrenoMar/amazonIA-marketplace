"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  isLoading?: boolean;
}

export function RatingModal({ isOpen, onClose, onSubmit, isLoading }: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calificar Vendedor"
      description="Tu opinión ayuda a mantener la calidad de los productos en AmazonIA y apoya a los artesanos locales."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-sm font-semibold text-slate-900 mb-4">¿Cómo calificarías tu experiencia?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Icon 
                  icon="mdi:star" 
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? "text-amber-400"
                      : "text-gray-300"
                  }`} 
                />
              </button>
            ))}
          </div>
          <span className="mt-4 text-brand-primary font-bold text-lg">
            {rating} {rating === 1 ? 'Estrella' : 'Estrellas'}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Enviar Calificación</Button>
        </div>
      </form>
    </Modal>
  );
}
