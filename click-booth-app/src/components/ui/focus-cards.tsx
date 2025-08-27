"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: Card;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "relative rounded-2xl overflow-hidden h-64 md:h-96 w-full cursor-pointer shadow-md transition-all duration-500 ease-out",
        hovered === index
          ? "scale-[1.02] shadow-xl"
          : hovered !== null
          ? "blur-sm scale-[0.97] opacity-80"
          : "scale-100"
      )}
    >
      {/* Background image */}
      <Image
        src={card.src}
        alt={card.title}
        fill
        className="object-cover absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
        sizes="(max-width: 700px) 100vw, 33vw"
      />

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6 transition-all duration-500",
          hovered === index
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        )}
      >
        <div className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg">
          {card.title}
        </div>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
};

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 md:px-10 w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}
