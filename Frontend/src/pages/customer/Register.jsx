import React, { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registered:", form);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6 text-center">
        Register
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gold/30"
      >
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        />
        <button className="bg-gold text-white w-full px-6 py-3 rounded-md font-semibold hover:bg-yellow-600 transition">
          Register
        </button>
      </form>
    </div>
  );
}
