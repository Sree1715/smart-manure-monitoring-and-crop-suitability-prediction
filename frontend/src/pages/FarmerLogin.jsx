import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout, Mail, Lock, ArrowRight, Building2, ServerOff, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";
import { checkBackendHealth, IS_PRODUCTION } from "../services/api.js";

const DEMO_FARMER = {
  email: "ramesh.kumar@farm.in",
  password: "farmer123",
  user: {
    id: 101,
    name: "Ramesh Kumar",
    email: "ramesh.kumar@farm.in",
    role: "farmer",
    district: "Karur",
    farm_id: "TN-KAR-1001",
    village: "Kulithalai",
    farm_name: "Kaveri Valley Green Farm"
  }
};

export default function FarmerLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((ok) => {
      if (!ok) {
        // Only set warning if server is genuinely unreachable, but don't block
        setBackendDown(true);
      } else {
        setBackendDown(false);
      }
    });
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const fillDemoFarmer = () => {
    setForm({
      email: DEMO_FARMER.email,
      password: DEMO_FARMER.password,
    });
    setError("");
  };

  const handleInstantDemoLogin = () => {
    // Allows immediate exploration without waiting for cloud cold boot
    localStorage.setItem("access_token", "demo-farmer-token-" + Date.now());
    localStorage.setItem("user", JSON.stringify(DEMO_FARMER.user));
    window.dispatchEvent(new Event("storage"));

    setMessage(
      isTamil
        ? "டெமோ முறையில் உள்நுழைவு வெற்றிகரமாக முடிந்தது! கட்டுப்பாட்டு பலகைக்கு திருப்பி விடப்படுகிறது..."
        : "Demo session initiated! Redirecting to Farmer Dashboard..."
    );

    setTimeout(() => {
      navigate("/farmer-dashboard");
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);
    setLoadingStage(isTamil ? "சரிபார்க்கப்படுகிறது..." : "Authenticating...");

    // Timer to update status if Render is cold-starting
    const coldStartTimer = setTimeout(() => {
      setLoadingStage(
        isTamil
          ? "சேவையகம் தொடங்குகிறது (Render இலவச அடுக்கு ~30 நொடிகள்)..."
          : "Waking up cloud server (Render free tier takes ~30s)..."
      );
    }, 4000);

    try {
      const response = await authService.loginFarmer({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      clearTimeout(coldStartTimer);

      if (response.data?.success || response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        // Notify Navbar and other listeners immediately
        window.dispatchEvent(new Event("storage"));

        setMessage(
          isTamil
            ? "உள்நுழைவு வெற்றிகரமாக முடிந்தது! கட்டுப்பாட்டு பலகைக்கு திருப்பி விடப்படுகிறது..."
            : "Login successful! Redirecting to Farmer Dashboard..."
        );

        setTimeout(() => {
          navigate("/farmer-dashboard");
        }, 600);
      } else {
        setError(response.data?.message || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது." : "Login failed."));
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      console.error("Farmer login error:", err);
      setError(
        err.friendlyMessage ||
          (isTamil
            ? "உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்."
            : "Login failed. Please try again or use Quick Demo Access below.")
      );
      if (!err.response) setBackendDown(true);
    } finally {
      setLoading(false);
      setLoadingStage("");
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
      <div className="flex flex-col items-center justify-center p-5 sm:p-8 lg:p-10 bg-surface gap-4">
        {backendDown && (
          <div className="w-full max-w-sm flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 text-xs shadow-sm">
            <ServerOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {isTamil ? "சேவையக அறிவிப்பு" : "Server Connection"}
              </p>
              <p className="text-amber-700 leading-relaxed">
                {IS_PRODUCTION
                  ? isTamil
                    ? "கிளவுட் சேவையகம் துவங்குகிறது (~30 நொடிகள்). காத்திருக்கலாம் அல்லது உடனடி டெமோவை பயன்படுத்தலாம்."
                    : "Cloud backend is starting (~30s). You can log in normally or use Instant Demo Access below."
                  : isTamil
                  ? "டெர்மினலில் 'npm run backend' ஐ இயக்கி மீண்டும் முயற்சிக்கவும்."
                  : "Ensure backend is running locally (npm run backend)."}
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <span className="badge bg-primary-50 text-primary-700 mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold">
              {isTamil ? "விவசாயி போர்ட்டல்" : "Farmer Portal"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5">
              {t("auth.farmerLoginTitle")}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500">
              {isTamil ? "அதிகாரியா? " : "Are you an authority? "}
              <Link
                to="/authority-login"
                className="text-primary-600 font-semibold hover:underline"
              >
                {isTamil ? "இங்கே உள்நுழைக" : "Authority Login"}
              </Link>
            </p>
          </div>

          {/* Quick Demo Autofill Pill */}
          <div className="mb-4">
            <button
              type="button"
              onClick={fillDemoFarmer}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-primary-200 bg-primary-50/70 hover:bg-primary-100/70 text-primary-900 text-xs transition duration-150 text-left"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600 shrink-0" />
                <span>
                  <strong className="font-semibold">{isTamil ? "டெமோ விவசாயி கணக்கு:" : "Demo Farmer:"}</strong>{" "}
                  ramesh.kumar@farm.in
                </span>
              </span>
              <span className="text-[11px] font-bold text-primary-700 bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                {isTamil ? "நிரப்பு" : "Auto-Fill"}
              </span>
            </button>
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
              autoCapitalize="none"
              autoComplete="email"
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
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                {isTamil ? "என்னை நினைவில் கொள்க" : "Remember me"}
              </label>

              <Link
                to="/contact"
                className="text-primary-600 font-medium hover:underline text-xs"
              >
                {isTamil ? "உதவி தேவையா?" : "Need help?"}
              </Link>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs sm:text-sm text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              disabled={loading}
              className="mt-2 min-h-[44px]"
            >
              {loading ? (loadingStage || t("auth.loggingIn")) : t("auth.loginBtn")}
            </Button>

            {/* Instant Demo Access Button */}
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-primary-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-primary-700 text-xs font-semibold transition shadow-xs mt-1 min-h-[40px]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTamil ? "உடனடி டெமோ அணுகல் (காத்திருக்க தேவையில்லை)" : "Quick Demo Access (Skip server wait)"}</span>
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              {t("auth.noAccount")}{" "}
              <Link
                to="/register"
                className="text-primary-600 font-semibold hover:underline"
              >
                {t("auth.registerBtn")}
              </Link>
            </p>

            <Link
              to="/authority-login"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-500 hover:text-primary-600 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              {isTamil ? "அரசு வேளாண் அதிகாரி போர்ட்டல்" : "Government Authority Portal"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
