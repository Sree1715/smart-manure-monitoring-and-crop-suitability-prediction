import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Mail, Lock, ArrowRight, Building2 } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";

export default function FarmerLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await authService.loginFarmer({
        email: form.email,
        password: form.password,
      });

      if (response.data?.success || response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        setMessage("Login successful! Redirecting to Farmer Dashboard...");

        setTimeout(() => {
          navigate("/farmer-dashboard");
        }, 800);
      } else {
        setError(response.data?.message || "Login failed.");
      }
    } catch (err) {
      console.error("Farmer login error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`Login failed: ${err.message}`);
      } else {
        setError("Login failed. Please check that the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-70px)] grid lg:grid-cols-2">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-600 to-secondary-600 p-8 lg:p-12 text-white relative overflow-hidden">
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </span>
            <span className="font-display font-bold text-lg">Smart Manure Monitor</span>
          </Link>
        </div>

        <div className="relative my-auto py-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm text-white mb-4">
            Farmer Portal
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            Welcome back to your farm insights
          </h2>

          <p className="text-white/85 leading-relaxed max-w-sm text-sm sm:text-base">
            Log in to view your manure readings, track trends over time, and get
            personalized crop suitability predictions.
          </p>
        </div>

        <p className="relative text-xs text-white/70">
          Organic agriculture insights &bull; GOBARdhan SIH1767
        </p>
      </div>

      {/* Right login form */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-surface">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <span className="badge bg-primary-50 text-primary-700 mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold">
              Farmer Portal
            </span>

            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">
              Log in to your account
            </h1>

            <p className="text-sm text-slate-500">
              Are you an authority?{" "}
              <Link
                to="/authority-login"
                className="text-primary-600 font-medium hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Email Address"
              type="email"
              name="email"
              icon={Mail}
              placeholder="ramesh.kumar@farm.in"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              icon={Lock}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                Remember me
              </label>

              <a
                href="#"
                className="text-primary-600 font-medium hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs sm:text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm text-emerald-700">
                {message}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              disabled={loading}
              className="mt-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 font-medium hover:underline"
              >
                Register now
              </Link>
            </p>

            <p className="text-xs text-slate-500 mt-2.5 bg-white py-1.5 px-3 rounded-lg border border-slate-200/80 shadow-xs">
              💡 Demo: <strong className="text-slate-800">ramesh.kumar@farm.in</strong> / <strong className="text-slate-800">farmer123</strong>
            </p>

            <Link
              to="/authority-login"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-400 hover:text-primary-600 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" /> Government Authority? Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
