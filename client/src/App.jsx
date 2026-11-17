import { useState } from "react";
import axios from "axios";
import Dashboard from "./dashboard";

const API_URL = "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("sat_token") || "");
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("sat_admin");
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem("sat_token", res.data.token);
      localStorage.setItem("sat_admin", JSON.stringify(res.data.admin));
      setToken(res.data.token);
      setAdmin(res.data.admin);
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Check your server.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sat_token");
    localStorage.removeItem("sat_admin");
    setToken("");
    setAdmin(null);
  };

  // 1. LOGIN VIEW (Shown when not authenticated)
  if (!token || !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 flex flex-col">
        <header className="w-full bg-emerald-600 text-white py-3 px-6 shadow-md flex items-center gap-3">
          <img
            className="w-9 h-9 rounded-full object-cover bg-white p-0.5"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGnAWmZ3UbJ_B2F0JEFklx7tjEDM74VL9xBFERwIHHupCzWp_FcYa8Cmc&s=10"
            alt="Municipality of Obando Logo"
          />
          <span className="text-sm font-semibold tracking-wide">
            Municipality of Obando
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-emerald-600 w-full max-w-4xl rounded-4xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm border border-slate-200">
            <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-lg">
              <img
                className="w-full h-80 md:h-[420px] object-cover"
                src="https://alchetron.com/cdn/obando-bulacan-6dd7a5fc-a038-4f4e-88b0-901d9ffbd4b-resize-750.jpg"
                alt="Municipality of Obando"
              />
            </div>

            <div className="bg-white w-full md:w-1/2 rounded-xl shadow-md border border-slate-200 p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-800">
                  SeniorAllowanceTrack
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Sign in to manage senior citizen allowances
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sat.gov.ph"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN SHELL (Renders Sidebar & Dashboard)
  return <Dashboard token={token} admin={admin} onLogout={handleLogout} />;
}
