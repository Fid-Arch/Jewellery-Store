import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1920",
    title: "High Jewellery",
    cta: "Explore High Jewellery",
    link: "/high-jewellery",
  },
  {
    img: "https://images.unsplash.com/photo-1520962922320-2038eebab146?q=80&w=1920",
    title: "Fine Jewellery",
    cta: "Shop Fine Jewellery",
    link: "/fine-jewellery",
  },
  {
    img: "https://images.unsplash.com/photo-1617038260897-43e95f1d30bb?q=80&w=1920",
    title: "Luxury Collections",
    cta: "Discover Luxury",
    link: "/luxury-collections",
  },
];

export default function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setI((prev) => (prev + 1) % slides.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[70vh] overflow-hidden">
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${s.img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full h-full bg-black/50 flex items-center justify-center text-center px-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-gold-400 drop-shadow-lg mb-6">
                {s.title}
              </h1>
              <Link
                to={s.link}
                className="px-6 py-3 border-2 border-gold-400 text-gold-400 font-semibold rounded-lg hover:bg-gold-400 hover:text-black transition-all duration-300 shadow-lg"
              >
                {s.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`h-3 w-3 rounded-full ${
              idx === i ? "bg-gold-400" : "bg-white/60"
            }`}
          ></span>
        ))}
      </div>
    </div>
  );
}
