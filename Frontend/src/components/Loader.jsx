import React from "react";

export default function Loader() {
  return (
    <div className="w-full py-20 flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-gold animate-spin"></div>
    </div>
  );
}
