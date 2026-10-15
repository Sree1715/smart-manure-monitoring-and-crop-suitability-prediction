import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

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
      setError(isTamil ? "கடவுச்சொற்கள் பொருந்தவில்லை." : "Passwords do not match.");
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
        setMessage(isTamil ? "கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! இப்போது உள்நுழையலாம்." : "Account created successfully! You can now log in.");

        setForm({
          name: "",
          email: "",
          phone: "",
          location: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setError(response.data?.message || (isTamil ? "பதிவு செய்தல் தோல்வியடைந்தது." : "Registration failed."));
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`Registration failed: ${err.message}`);
      } else {
        setError(
          isTamil
            ? "பதிவு செய்தல் தோல்வியடைந்தது. பின்தளம் இயங்குகிறதா என சரிபார்க்கவும்."
            : "Registration failed. Please check if the backend is running.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page section-padding max-w-2xl">
      <div className="text-center mb-8">
        <span className="badge bg-secondary-50 text-secondary-700 mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
          {isTamil ? "கணக்கை உருவாக்கவும்" : "Create Account"}
        </span>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t("auth.registerTitle")}
        </h1>

        <p className="text-slate-500">
          {t("auth.registerSubtitle")}
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
            {isTamil ? "விவசாயி" : "Farmer"}
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
            {isTamil ? "அதிகாரி" : "Authority"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("settings.fullName")}
              name="name"
              icon={User}
              placeholder={isTamil ? "உங்கள் முழு பெயர்" : "Enter your full name"}
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label={t("settings.phone")}
              name="phone"
              icon={Phone}
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label={t("settings.email")}
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
                ? (isTamil ? "பண்ணை இருப்பிடம்" : "Farm Location")
                : (isTamil ? "அதிகார வரம்பு / அலுவலக இருப்பிடம்" : "Jurisdiction / Office Location")
            }
            name="location"
            icon={MapPin}
            placeholder={isTamil ? "மாவட்டம், மாநிலம்" : "District, State"}
            value={form.location}
            onChange={handleChange}
            required
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={isTamil ? "கடவுச்சொல்" : "Password"}
              type="password"
              name="password"
              icon={Lock}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Input
              label={isTamil ? "கடவுச்சொல்லை உறுதிப்படுத்தவும்" : "Confirm Password"}
              type="password"
              name="confirmPassword"
              icon={Lock}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
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
            {loading ? (isTamil ? "பதிவு செய்யப்படுகிறது..." : "Creating Account...") : t("auth.registerBtn")}
          </Button>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          {t("auth.hasAccount")}{" "}
          <Link
            to={role === "farmer" ? "/farmer-login" : "/authority-login"}
            className="text-primary-600 font-medium hover:underline"
          >
            {t("nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
