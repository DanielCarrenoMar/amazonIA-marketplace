import React from 'react';
import Image from 'next/image';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

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
}: ProductCardProps) {
  return (
    <Card
      padding="none"
      rounded="3xl"
      hoverable={true}
      className="flex flex-col group h-full"
    >
      <div className="relative w-full aspect-3/2 bg-gray-100 overflow-hidden">
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

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/80! backdrop-blur-md hover:bg-white! hover:scale-110 z-10 shadow-sm"
        >
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </Button>
      </div>

      <div className="p-5 flex flex-col gap-3 grow">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-brand-nature-content">{title}</h3>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300 stroke-2'
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
            rightIcon={<ShoppingCart className="w-4 h-4" />}
          >
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
