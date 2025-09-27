import { useState } from "react";
import { useNavigate } from "react-router-dom"
import { registerUser } from "../../utils/api";

export default function CustomerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("")
    setLoading(true)

    // Example future integration (uncomment/adjust):
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const result = await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: normalizedEmail,
        password: form.password,
        roles_id: 1
      });
      // Auto-login or navigate to login
      navigate("/login");
    } catch (err) {
      setError(`❌ ${err.message || 'Registration failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-yellow-600 mb-6">
          Goldmarks Register
        </h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>} {/* ✅ Add error display like Login */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gold/30"
        >
          <input
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
            required
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4"> {/* ✅ Match Login link style */}
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/login");
              setError(""); // Optional: Clear error
            }}
            className="text-yellow-600 hover:underline font-medium"
            disabled={loading}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
