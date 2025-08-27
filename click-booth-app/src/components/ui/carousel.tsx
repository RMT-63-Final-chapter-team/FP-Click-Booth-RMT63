"use client";

import { IconArrowNarrowRight } from "@tabler/icons-react";
import Image from "next/image";
import { useState, useRef, useId, useEffect } from "react";

interface SlideData {
  title: string;
  button: string;
  src: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      const x = xRef.current;
      const y = yRef.current;
      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const { src, button, title } = slide;

  return (
    <li
      ref={slideRef}
      className="relative w-[70vmin] h-[70vmin] flex items-center justify-center mx-[4vmin] rounded-2xl overflow-hidden shadow-xl transition-all duration-500"
      onClick={() => handleSlideClick(index)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform:
          current !== index
            ? "scale(0.96) rotateX(6deg)"
            : "scale(1) rotateX(0deg)",
        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        transformOrigin: "bottom",
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          transform:
            current === index
              ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
              : "none",
        }}
      >
        <Image
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          fill
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <article
        className={`relative z-10 p-6 text-center transition-all duration-700 ${
          current === index
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
          {title}
        </h2>
        <button className="mt-6 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl shadow hover:bg-red-600 transition">
          {button}
        </button>
      </article>
    </li>
  );
};

const CarouselControl = ({
  type,
  handleClick,
}: {
  type: "previous" | "next";
  handleClick: () => void;
}) => (
  <button
    onClick={handleClick}
    className={`w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border hover:scale-105 transition ${
      type === "previous" ? "rotate-180" : ""
    }`}
  >
    <IconArrowNarrowRight className="text-red-500" />
  </button>
);

export function Carousel({ slides }: { slides: SlideData[] }) {
  const [current, setCurrent] = useState(0);

  const handlePreviousClick = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const handleNextClick = () =>
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  const handleSlideClick = (index: number) => setCurrent(index);

  const id = useId();

  return (
    <div
      className="relative w-[70vmin] h-[70vmin] mx-auto"
      aria-labelledby={`carousel-heading-${id}`}
    >
      <ul
        className="absolute flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            index={index}
            current={current}
            handleSlideClick={handleSlideClick}
          />
        ))}
      </ul>

      {/* Controls */}
      <div className="absolute flex justify-center gap-3 w-full top-[calc(100%+1rem)]">
        <CarouselControl type="previous" handleClick={handlePreviousClick} />
        <CarouselControl type="next" handleClick={handleNextClick} />
      </div>
    </div>
  );
}
