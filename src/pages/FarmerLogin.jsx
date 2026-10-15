import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout, Mail, Lock, ArrowRight, Building2, ServerOff } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";
import { checkBackendHealth } from "../services/api.js";

export default function FarmerLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((ok) => {
      if (!ok) setBackendDown(true);
    });
  }, []);

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

        setMessage(isTamil ? "உள்நுழைவு வெற்றிகரமாக முடிந்தது! கட்டுப்பாட்டு பலகைக்கு திருப்பி விடப்படுகிறது..." : "Login successful! Redirecting to Farmer Dashboard...");

        setTimeout(() => {
          navigate("/farmer-dashboard");
        }, 800);
      } else {
        setError(response.data?.message || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது." : "Login failed."));
      }
    } catch (err) {
      console.error("Farmer login error:", err);
      setError(err.friendlyMessage || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Login failed. Please try again."));
      if (!err.response) setBackendDown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-70px)] grid lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-600 to-secondary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </span>
            <span className="font-display font-bold text-lg">{t("footer.brandTitle")}</span>
          </Link>
        </div>

        <div className="relative my-auto py-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm text-white mb-4">
            {isTamil ? "விவசாயி போர்ட்டல்" : "Farmer Portal"}
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            {isTamil ? "உங்கள் பண்ணை நுண்ணறிவுகளுக்கு மீண்டும் வருக" : "Welcome back to your farm insights"}
          </h2>

          <p className="text-white/85 leading-relaxed max-w-sm text-sm sm:text-base">
            {isTamil
              ? "உங்கள் உர அளவீடுகளைப் பார்க்கவும், மாற்றங்களை கண்காணிக்கவும், தனிப்பயனாக்கப்பட்ட பயிர் கணிப்புகளைப் பெறவும் உள்நுழைக."
              : "Log in to view your manure readings, track trends over time, and get personalized crop suitability predictions."}
          </p>
        </div>

        <p className="relative text-xs text-white/70">
          {t("nav.tagline")} &bull; GOBARdhan SIH1767
        </p>
      </div>

      {/* Right login form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 bg-surface gap-4">
        {backendDown && (
          <div className="w-full max-w-sm flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 text-xs shadow-sm">
            <ServerOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold mb-0.5">{isTamil ? "பின்தள சேவை கண்டறியப்படவில்லை" : "Backend server not detected"}</p>
              <p className="text-amber-700">{isTamil ? "டெர்மினலில் npm run backend ஐ இயக்கி மீண்டும் முயற்சிக்கவும்." : "Run npm run backend in a terminal, then try again."}</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <span className="badge bg-primary-50 text-primary-700 mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold">
              {isTamil ? "விவசாயி போர்ட்டல்" : "Farmer Portal"}
            </span>

            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">
              {t("auth.farmerLoginTitle")}
            </h1>

            <p className="text-sm text-slate-500">
              {isTamil ? "அதிகாரியா? " : "Are you an authority? "}
              <Link
                to="/authority-login"
                className="text-primary-600 font-medium hover:underline"
              >
                {isTamil ? "இங்கே உள்நுழைக" : "Login here"}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label={t("settings.email")}
              type="email"
              name="email"
              icon={Mail}
              placeholder="ramesh.kumar@farm.in"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              label={isTamil ? "கடவுச்சொல்" : "Password"}
              type="password"
              name="password"
              icon={Lock}
              placeholder={t("auth.passwordPlaceholder")}
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
                {isTamil ? "என்னை நினைவில் கொள்க" : "Remember me"}
              </label>

              <a
                href="#"
                className="text-primary-600 font-medium hover:underline"
              >
                {isTamil ? "கடவுச்சொல் மறந்துவிட்டதா?" : "Forgot password?"}
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
              {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              {t("auth.noAccount")}{" "}
              <Link
                to="/register"
                className="text-primary-600 font-medium hover:underline"
              >
                {t("auth.registerBtn")}
              </Link>
            </p>

            <p className="text-xs text-slate-500 mt-2.5 bg-white py-1.5 px-3 rounded-lg border border-slate-200/80 shadow-xs">
              💡 Demo: <strong className="text-slate-800">ramesh.kumar@farm.in</strong> / <strong className="text-slate-800">farmer123</strong>
            </p>

            <Link
              to="/authority-login"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-400 hover:text-primary-600 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" /> {isTamil ? "வேளாண் துறை அதிகாரியா? இங்கே உள்நுழைக" : "Government Authority? Login here"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
