import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Mail, Lock, ArrowRight, Sprout, ServerOff } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";
import { checkBackendHealth } from "../services/api.js";

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [form, setForm] = useState({ email: "", password: "" });
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
      const response = await authService.loginAuthority({
        email: form.email,
        password: form.password,
      });

      if (response.data?.success || response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        setMessage(isTamil ? "உள்நுழைவு வெற்றிகரமாக முடிந்தது! அதிகாரி பலகைக்கு திருப்பி விடப்படுகிறது..." : "Login successful! Redirecting to Authority Dashboard...");

        setTimeout(() => {
          navigate("/authority-dashboard");
        }, 800);
      } else {
        setError(response.data?.message || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது." : "Login failed."));
      }
    } catch (err) {
      console.error("Authority login error:", err);
      setError(err.friendlyMessage || (isTamil ? "உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Login failed. Please try again."));
      if (!err.response) setBackendDown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-70px)] grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 bg-surface order-2 lg:order-1 gap-4">

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
            <span className="badge bg-accent-50 text-accent-700 mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold">
              {isTamil ? "அதிகாரி போர்ட்டல்" : "Authority Portal"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">
              {t("auth.authorityLoginTitle")}
            </h1>
            <p className="text-sm text-slate-500">
              {isTamil ? "விவசாயியா? " : "Are you a farmer? "}
              <Link
                to="/farmer-login"
                className="text-primary-600 font-medium hover:underline"
              >
                {isTamil ? "இங்கே உள்நுழைக" : "Login here"}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label={isTamil ? "அதிகாரப்பூர்வ மின்னஞ்சல்" : "Official Email"}
              type="email"
              name="email"
              icon={Mail}
              placeholder="admin@gobardhan.gov.in"
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
              variant="accent"
              fullWidth
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              disabled={loading}
              className="mt-2"
            >
              {loading ? (isTamil ? "சரிபார்க்கப்படுகிறது..." : "Authenticating...") : t("auth.loginBtn")}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs text-slate-400">
              {isTamil ? "அதிகாரி அணுகலுக்கு சரிபார்ப்பு தேவைப்படுகிறது." : "Authority access requires verification. Contact admin for credential issues."}
            </p>
            <p className="text-xs text-slate-500 mt-2 bg-white py-1.5 px-3 rounded-lg border border-slate-200/80 shadow-xs">
              💡 Demo: <strong className="text-slate-800">admin@gobardhan.gov.in</strong> / <strong className="text-slate-800">admin123</strong>
            </p>
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
