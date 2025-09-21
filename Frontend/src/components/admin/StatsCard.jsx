import React from "react";

function StatsCard({
  title,
  value,
  icon: Icon,
  color = "from-yellow-400 to-yellow-600",
}) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 flex items-center gap-4 hover:shadow-xl transition">
      <div
        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
      >
        <Icon size={26} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default StatsCard;
