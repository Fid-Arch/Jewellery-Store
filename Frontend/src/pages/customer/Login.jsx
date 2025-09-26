import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { loginUser } from "../../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore(); // ✅ use login from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // // Dummy credentials
  // const credentials = {
  //   "admin@goldmarks.com": { password: "admin123", role: "admin" },
  //   "staff@goldmarks.com": { password: "staff123", role: "staff" },
  //   "customer@goldmarks.com": { password: "customer123", role: "customer" },
  // };

  const handleLogin = async(e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Normalize email: trim spaces & lowercase
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const result = await loginUser({
        email: normalizedEmail,
        password
      })

      const { user } = result; // Assume response has user object with role
      
      // const user = await loginUser({
      //   email: normalizedEmail,
      //   password: password
      // })

      login({
        email: normalizedEmail,
        role: user.role,
        token: result.token
      })

      if (user.role === 1) navigate("/profile")
      else navigate("/admin")
    } catch (err) {
      setError(`❌ ${err.message || 'Login failed. Check credentials.'}`)
    } finally {
      setLoading(false);
    }

    // if (credentials[normalizedEmail]) {
    //   if (credentials[normalizedEmail].password === password) {
    //     const role = credentials[normalizedEmail].role;

    //     // ✅ Pass full object
    //     login({ email: normalizedEmail, role });

    //     if (role === "admin") navigate("/admin");
    //     else if (role === "staff") navigate("/staff");
    //     else navigate("/profile");
    //   } else {
    //     setError("❌ Invalid password. Try again.");
    //   }
    // } else {
    //   setError(
    //     "❌ Invalid email. Use admin@goldmarks.com, staff@goldmarks.com, or customer@goldmarks.com"
    //   );
    // }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-yellow-600 mb-6">
          Goldmarks Login
        </h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          No account?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/register");
              setError(""); // Optional: Clear error on navigation
            }}
            className="text-yellow-600 hover:underline font-medium"
            disabled={loading}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
