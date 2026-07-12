"use client";

import { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { Button } from './Button';

interface BannerProps {
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  image: string;
}

export function BannerCarousel({ banners }: { banners: BannerProps[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const prev = () => setCurrent((c) => (c === 0 ? banners.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c + 1) % banners.length);

  return (
    <div className="relative w-full mb-8 overflow-hidden group">
      <div 
        className="flex transition-transform duration-700 ease-out" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div key={i} className="w-full shrink-0 flex flex-col md:flex-row items-center justify-between gap-8 pb-12 px-8 md:px-16 lg:px-20">
            <div className="w-full md:w-1/2 text-slate-900">
              <span className="inline-block px-3 py-1 bg-brand-primary/15 text-brand-primary rounded-full text-xs font-bold mb-4 tracking-wide uppercase">
                {banner.tag}
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-slate-900">
                {banner.title}
              </h2>
              <p className="text-muted mb-8 text-lg max-w-md">
                {banner.description}
              </p>
              <Button className="rounded-full px-8 shadow-sm" variant="primary" size="lg">
                {banner.buttonText}
              </Button>
            </div>
            <div className="w-full md:w-1/2 flex justify-end">
              <div className="relative w-full max-w-lg aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-gray-200">
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button 
        onClick={prev}
        className="absolute left-2 md:left-4 top-[45%] -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur-md hover:bg-slate-900/70 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-white/20 z-10 text-white"
      >
        <Icon icon="lucide:chevron-left" className="w-6 h-6" />
      </button>
      <button 
        onClick={next}
        className="absolute right-2 md:right-4 top-[45%] -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur-md hover:bg-slate-900/70 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-white/20 z-10 text-white"
      >
        <Icon icon="lucide:chevron-right" className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${current === i ? 'bg-brand-primary w-8' : 'bg-brand-primary/30 w-2 hover:bg-brand-primary/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
