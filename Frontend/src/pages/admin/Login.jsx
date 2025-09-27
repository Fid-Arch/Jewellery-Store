import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { loginUser } from "../../utils/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const result = await loginUser({
        email: normalizedEmail,
        password
      });

      const { user } = result;

      // ✅ Assume backend verifies admin role; set in context
      login({
        email: normalizedEmail,
        roles_id: user.roles_id,
        token: result.token
      });

      // ✅ Navigate to admin dashboard on success
      if (user.roles_id === 2) navigate("/admin")
      else navigate("/profile")
    } catch (err) {
      setError(`❌ ${err.message || 'Admin login failed. Check credentials.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-yellow-600 mb-6">
          Admin Login
        </h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-600 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          No admin account?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/admin/register");
              setError(""); // Optional: Clear error on navigation
            }}
            className="text-yellow-600 hover:underline font-medium"
            disabled={loading}
          >
            Create admin account
          </button>
        </p>
        {/* Optional: Link to main login if needed */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Customer login?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-yellow-600 hover:underline font-medium"
          >
            Go to Customer Login
          </button>
        </p>
      </div>
    </div>
  );
}