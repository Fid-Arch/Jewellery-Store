import React from "react";

export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {["All", ...categories].map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-4 py-2 rounded-full border transition ${
            active === c
              ? "bg-gold text-white border-gold"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gold hover:text-white"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
