import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  KeyRound,
  CheckCircle2,
  Send,
  Sparkles,
} from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { authService } from "../services/authService.js";

export default function Register() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState("");

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
    // If email changes, reset OTP verification
    if (e.target.name === "email" && otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
      setDevOtpHint("");
    }
  };

  const handleSendOtp = async () => {
    if (!form.email || !form.email.includes("@")) {
      setError(isTamil ? "செல்லுபடியாகும் மின்னஞ்சல் முகவரியை உள்ளிடவும்." : "Please enter a valid email address first.");
      return;
    }

    setError("");
    setMessage("");
    setOtpSending(true);

    try {
      const res = await authService.sendOtp(form.email);
      if (res.data?.success) {
        setOtpSent(true);
        setMessage(t("auth.otpSentSuccess"));
        if (res.data?.dev_otp) {
          setDevOtpHint(res.data.dev_otp);
        }
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setError(err.friendlyMessage || (isTamil ? "OTP அனுப்புவதில் பிழை. மீண்டும் முயற்சிக்கவும்." : "Failed to send OTP. Please try again."));
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setError(isTamil ? "முழுமையான OTP குறியீட்டை உள்ளிடவும்." : "Please enter the full OTP code.");
      return;
    }

    setError("");
    setMessage("");
    setOtpVerifying(true);

    try {
      const res = await authService.verifyOtp(form.email, otpCode.trim());
      if (res.data?.success) {
        setOtpVerified(true);
        setMessage(t("auth.otpVerifiedSuccess"));
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.friendlyMessage || (isTamil ? "தவறான அல்லது காலாவதியான OTP." : "Invalid or expired OTP code."));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!otpVerified && !otpCode) {
      setError(t("auth.otpRequiredError"));
      return;
    }

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
        otp: otpCode.trim(),
      });

      if (response.data?.success) {
        // Automatically save access token & user profile
        if (response.data?.access_token) {
          localStorage.setItem("access_token", response.data.access_token);
        }
        if (response.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        setMessage(
          isTamil
            ? "கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! உங்கள் கட்டுப்பாட்டு பலகைக்கு திருப்பி விடப்படுகிறது..."
            : "Account created successfully! Redirecting to your dashboard..."
        );

        setTimeout(() => {
          if (role === "farmer") {
            navigate("/farmer-dashboard");
          } else {
            navigate("/authority-dashboard");
          }
        }, 1200);
      } else {
        setError(response.data?.message || (isTamil ? "பதிவு செய்தல் தோல்வியடைந்தது." : "Registration failed."));
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.friendlyMessage) {
        setError(err.friendlyMessage);
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
          <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
          {isTamil ? "புதிய விவசாயி பதிவு" : "New Farmer Registration"}
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
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email input with Send OTP action */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-slate-700">
              {t("settings.email")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="farmer@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={otpVerified}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {!otpVerified ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || !form.email}
                  className="px-3.5 py-2 sm:py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {otpSending
                    ? t("auth.sendingOtp")
                    : otpSent
                    ? t("auth.resendOtp")
                    : t("auth.sendOtp")}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTamil ? "சரிபார்க்கப்பட்டது" : "Verified"}
                </div>
              )}
            </div>
          </div>

          {/* OTP Code Input (visible after sending OTP) */}
          {otpSent && !otpVerified && (
            <div className="p-3.5 bg-primary-50/70 border border-primary-200 rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary-600" />
                  {t("auth.otpLabel")}
                </label>
                {devOtpHint && (
                  <span className="text-[11px] font-mono font-medium text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded border border-primary-300">
                    OTP: <strong>{devOtpHint}</strong>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder={t("auth.otpPlaceholder")}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm tracking-widest font-mono text-center border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || !otpCode}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
                >
                  {otpVerifying ? t("auth.verifyingOtp") : t("auth.verifyOtp")}
                </button>
              </div>
              <p className="text-[11px] text-primary-700/90 leading-tight">
                {isTamil
                  ? "உங்கள் மின்னஞ்சலில் பெறப்பட்ட 6 இலக்க குறியீட்டை உள்ளிடவும்."
                  : "Check your email inbox or spam folder for the 6-digit verification code."}
              </p>
            </div>
          )}

          <Input
            label={
              role === "farmer"
                ? (isTamil ? "பண்ணை மாவட்டம் / இருப்பிடம்" : "Farm District / Location")
                : (isTamil ? "அதிகார வரம்பு / அலுவலக இருப்பிடம்" : "Jurisdiction / Office Location")
            }
            name="location"
            icon={MapPin}
            placeholder={isTamil ? "எ.கா. கரூர், தமிழ்நாடு" : "e.g. Karur, Tamil Nadu"}
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

