"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { useFavorites } from '@/lib/favoriteContext';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';

export interface ProductCardProps {
  id?: string;
  image: string;
  discount?: string;
  title: string;
  rating: number;
  category: string;
  description: string;
  price: string;
  originalPrice?: string;
  href?: string;
  hideFavorite?: boolean;
}

export function ProductCard({
  image,
  discount,
  title,
  rating,
  category,
  description,
  price,
  originalPrice,
  href,
  hideFavorite = false,
}: ProductCardProps) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  
  // Si tenemos el id real del producto (pasado en ProductCardProps como id)
  // lo chequeamos. Algunos lugares pasan id, otros no.
  const productId = arguments[0].id;
  const isFavorite = productId ? favoriteIds.has(productId) : false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir que el click se vaya al link del producto
    if (!user) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }
    if (productId) {
      await toggleFavorite(productId);
    }
  };

  const ImageWrapper = href ? Link : 'div';
  const TitleWrapper = href ? Link : 'div';

  return (
    <Card
      padding="none"
      rounded="3xl"
      hoverable={true}
      className="flex flex-col group h-full"
    >
      <ImageWrapper href={href || '#'} className="relative w-full aspect-3/2 bg-gray-100 overflow-hidden block">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {discount && (
          <div className="absolute top-0 left-0 bg-brand-accent text-amber-950 px-5 py-1.5 font-black rounded-br-3xl text-md z-10 shadow-md">
            {discount}
          </div>
        )}

        {!hideFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 bg-white/80! backdrop-blur-md hover:bg-white! hover:scale-110 z-10 shadow-sm"
          >
            <Icon 
              icon={isFavorite ? "mdi:heart" : "mdi:heart-outline"} 
              className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-500'}`} 
            />
          </Button>
        )}
      </ImageWrapper>

      <div className="p-5 flex flex-col gap-3 grow">
        <div className="flex justify-between items-start gap-2">
          {href ? (
            <Link href={href} className="hover:underline">
              <h3 className="font-bold text-lg text-brand-nature-content line-clamp-2">{title}</h3>
            </Link>
          ) : (
            <h3 className="font-bold text-lg text-brand-nature-content line-clamp-2">{title}</h3>
          )}
          <div className="flex gap-0.5 shrink-0 pt-1">
            {[...Array(5)].map((_, i) => (
              <Icon icon="mdi:star"
                key={i}
                className={`w-4 h-4 ${i < rating
                  ? 'text-amber-400'
                  : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>

        <div>
          <Badge
            variant="secondary"
            className="text-xs tracking-wide"
          >
            {category}
          </Badge>
        </div>

        <p className="text-muted text-xs leading-relaxed line-clamp-2">
          {description}
        </p>
        <div className="mt-auto flex justify-between items-center pt-2 gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-brand-nature-content">{price}</span>
              {originalPrice && (
                <span className="text-xs text-muted line-through font-semibold">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="font-medium!"
            rightIcon={<Icon icon="lucide:shopping-basket" className="w-4 h-4" />}
          >
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
