import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  Tractor,
  Building2,
} from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";

export default function Register() {
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        password: form.password,
        role: role,
      });

      if (response.data?.success) {
        setMessage("Account created successfully!");

        setForm({
          name: "",
          email: "",
          phone: "",
          location: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setError(response.data?.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`Registration failed: ${err.message}`);
      } else {
        setError(
          "Registration failed. Please check if the backend is running.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page section-padding max-w-2xl">
      <div className="text-center mb-8">
        <span className="badge bg-secondary-50 text-secondary-700 mb-4">
          Create Account
        </span>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Join Smart Manure Monitor
        </h1>

        <p className="text-slate-500">
          Register as a farmer or a government authority to get started.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-3 mb-7">
          <button
            type="button"
            onClick={() => setRole("farmer")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold border-2 transition-colors duration-200 ${
              role === "farmer"
                ? "border-primary-600 bg-primary-50 text-primary-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Tractor className="w-4 h-4" />
            Farmer
          </button>

          <button
            type="button"
            onClick={() => setRole("authority")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold border-2 transition-colors duration-200 ${
              role === "authority"
                ? "border-accent-600 bg-accent-50 text-accent-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Authority
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              icon={User}
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Phone Number"
              name="phone"
              icon={Phone}
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            icon={Mail}
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label={
              role === "farmer"
                ? "Farm Location"
                : "Jurisdiction / Office Location"
            }
            name="location"
            icon={MapPin}
            placeholder="District, State"
            value={form.location}
            onChange={handleChange}
            required
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              name="password"
              icon={Lock}
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              icon={Lock}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <label className="flex items-start gap-2.5 text-sm text-slate-600 pt-1">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            I agree to the Terms of Service and Privacy Policy.
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
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
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link
          to="/farmer-login"
          className="text-primary-600 font-medium hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
