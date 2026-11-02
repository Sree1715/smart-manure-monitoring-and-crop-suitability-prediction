import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Mail, Lock, ArrowRight, Sprout, ServerOff, Sparkles, CheckCircle2, Zap } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";
import { checkBackendHealth, IS_PRODUCTION } from "../services/api.js";

const DEMO_AUTHORITY = {
  email: "admin@smartmanure.gov.in",
  password: "admin123",
  user: {
    id: 1,
    name: "TN Agricultural Officer",
    email: "admin@smartmanure.gov.in",
    role: "authority",
    district: "Chennai HQ",
    farm_id: "TN-AUTH-001"
  }
};

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((ok) => {
      if (!ok) setBackendDown(true);
      else setBackendDown(false);
    });
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const fillDemoAuthority = () => {
    setForm({
      email: DEMO_AUTHORITY.email,
      password: DEMO_AUTHORITY.password,
    });
    setError("");
  };

  const handleInstantDemoLogin = () => {
    localStorage.setItem("access_token", "demo-auth-token-" + Date.now());
    localStorage.setItem("user", JSON.stringify(DEMO_AUTHORITY.user));
    window.dispatchEvent(new Event("storage"));

    setMessage(
      isTamil
        ? "அதிகாரி டெமோ முறைமை இயக்கப்பட்டது! பலகைக்கு திருப்பி விடப்படுகிறது..."
        : "Authority demo mode active! Redirecting to Authority Dashboard..."
    );

    setTimeout(() => {
      navigate("/authority-dashboard");
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    setLoadingStage(isTamil ? "சரிபார்க்கப்படுகிறது..." : "Authenticating...");

    const coldStartTimer = setTimeout(() => {
      setLoadingStage(
        isTamil
          ? "சேவையகம் தொடங்குகிறது (Render இலவச அடுக்கு ~30 நொடிகள்)..."
          : "Waking up cloud server (Render free tier takes ~30s)..."
      );
    }, 4000);

    try {
      const response = await authService.loginAuthority({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      clearTimeout(coldStartTimer);

      if (response.data?.success || response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        window.dispatchEvent(new Event("storage"));

        setMessage(
          isTamil
            ? "உள்நுழைவு வெற்றிகரமாக முடிந்தது! அதிகாரி பலகைக்கு திருப்பி விடப்படுகிறது..."
            : "Login successful! Redirecting to Authority Dashboard..."
        );

        setTimeout(() => {
          navigate("/authority-dashboard");
        }, 600);
      } else {
        setError(response.data?.message || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது." : "Login failed."));
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      console.error("Authority login error:", err);
      setError(
        err.friendlyMessage ||
          (isTamil
            ? "உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்."
            : "Login failed. Please verify credentials or use Quick Demo Access below.")
      );
      if (!err.response) setBackendDown(true);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-70px)] grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-5 sm:p-8 lg:p-10 bg-surface order-2 lg:order-1 gap-4">
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
            <span className="badge bg-accent-50 text-accent-700 mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold">
              {isTamil ? "அதிகாரி போர்ட்டல்" : "Authority Portal"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5">
              {t("auth.authorityLoginTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isTamil ? "விவசாயியா? " : "Are you a farmer? "}
              <Link
                to="/farmer-login"
                className="text-primary-600 font-semibold hover:underline"
              >
                {isTamil ? "விவசாயி உள்நுழைவு" : "Farmer Login"}
              </Link>
            </p>
          </div>

          {/* Quick Demo Autofill Pill */}
          <div className="mb-4">
            <button
              type="button"
              onClick={fillDemoAuthority}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-accent-200 bg-accent-50/70 hover:bg-accent-100/70 text-accent-950 text-xs transition duration-150 text-left"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-600 shrink-0" />
                <span>
                  <strong className="font-semibold">{isTamil ? "டெமோ அதிகாரி கணக்கு:" : "Demo Authority:"}</strong>{" "}
                  admin@smartmanure.gov.in
                </span>
              </span>
              <span className="text-[11px] font-bold text-accent-700 bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                {isTamil ? "நிரப்பு" : "Auto-Fill"}
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label={isTamil ? "அதிகாரப்பூர்வ மின்னஞ்சல்" : "Official Email"}
              type="email"
              name="email"
              icon={Mail}
              placeholder="admin@smartmanure.gov.in"
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
              variant="accent"
              fullWidth
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              disabled={loading}
              className="mt-2 min-h-[44px]"
            >
              {loading ? (loadingStage || (isTamil ? "சரிபார்க்கப்படுகிறது..." : "Authenticating...")) : t("auth.loginBtn")}
            </Button>

            {/* Instant Demo Access Button */}
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-accent-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-accent-700 text-xs font-semibold transition shadow-xs mt-1 min-h-[40px]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTamil ? "உடனடி டெமோ அணுகல் (காத்திருக்க தேவையில்லை)" : "Quick Demo Access (Skip server wait)"}</span>
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs text-slate-500">
              {isTamil ? "அதிகாரி அணுகலுக்கு அரசு சான்றளிப்பு தேவைப்படுகிறது." : "Authority portal for state and district agriculture officials."}
            </p>
            <Link
              to="/farmer-login"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-500 hover:text-primary-600 transition-colors"
            >
              <Sprout className="w-3.5 h-3.5 text-primary-600" />
              {isTamil ? "விவசாயி போர்ட்டலுக்கு செல்க" : "Switch to Farmer Portal"}
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 to-primary-900 p-8 lg:p-12 text-white relative overflow-hidden order-1 lg:order-2">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent-500/10 pointer-events-none" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </span>
            <span className="font-display font-bold text-lg">{t("footer.brandTitle")}</span>
          </Link>
        </div>
        <div className="relative my-auto py-6">
          <ShieldCheck className="w-10 h-10 text-accent-400 mb-4" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            {isTamil ? "பிராந்தியம் தழுவிய கண்காணிப்பு, ஒரே பலகையில்" : "Region-wide monitoring, in one dashboard"}
          </h2>
          <p className="text-white/80 leading-relaxed max-w-sm text-sm sm:text-base">
            {isTamil
              ? "உங்கள் அதிகார வரம்பிற்குட்பட்ட உர தரம் மற்றும் பயிர் கணிப்புகளை முழுமையாக மேற்பார்வையிடுங்கள்."
              : "Oversee manure quality trends, farmer activity, and crop suitability predictions across your jurisdiction."}
          </p>
        </div>
        <p className="relative text-xs text-white/60">
          {t("nav.tagline")} &bull; GOBARdhan SIH1767
        </p>
      </div>
    </div>
  );
}
