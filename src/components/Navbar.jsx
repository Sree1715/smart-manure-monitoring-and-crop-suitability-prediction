import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Sprout,
  Globe,
  ChevronDown,
  LayoutDashboard,
  Check,
  LogOut,
  UserCircle2,
} from "lucide-react";
import Button from "./Button.jsx";

const LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Ref for click-outside detection on the language dropdown
  const langRef = useRef(null);

  const currentLang =
    LANGUAGES.find((l) => l.code === (i18n.language || "en")) || LANGUAGES[0];

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close lang dropdown on click-outside OR Escape ── */
  useEffect(() => {
    if (!langOpen) return;

    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setLangOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [langOpen]);

  /* ── Close mobile menu on route change (resize safety) ── */
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  /* ── Auth user from localStorage ── */
  useEffect(() => {
    const updateUser = () => {
      try {
        const u = localStorage.getItem("user");
        setCurrentUser(u ? JSON.parse(u) : null);
      } catch {
        setCurrentUser(null);
      }
    };
    updateUser();
    window.addEventListener("storage", updateUser);
    return () => window.removeEventListener("storage", updateUser);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  const isAuthority = currentUser?.role === "authority";

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.features"), to: "/#features" },
    {
      label: t("nav.dashboard"),
      to: isAuthority ? "/authority-dashboard" : "/farmer-dashboard",
    },
    // Crop Prediction — hidden for authorities
    ...(isAuthority
      ? []
      : [{ label: t("nav.cropPrediction"), to: "/crop-prediction" }]),
    { label: t("nav.reports"), to: "/reports" },
    { label: t("nav.contact"), to: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-soft"
          : "bg-white/80 backdrop-blur-sm"
      } border-b border-slate-100`}
    >
      <nav className="container-page flex items-center justify-between h-16 md:h-[70px]">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shadow-soft">
            <Sprout className="w-5 h-5 text-white" />
          </span>
          <span className="font-display font-bold text-slate-900 text-[15px] leading-tight">
            Smart Manure
            <span className="block text-[11px] font-medium text-slate-400 -mt-0.5">
              {t("nav.tagline")}
            </span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive && link.to !== "/#features"
                    ? "text-primary-700 bg-primary-50"
                    : "text-slate-600 hover:text-primary-700 hover:bg-slate-50"
                }`
              }
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* ── Desktop right controls ── */}
        <div className="hidden lg:flex items-center gap-2">

          {/* Language Switcher — click-outside aware */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4 text-primary-600" />
              <span>{currentLang.nativeName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {langOpen && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-[9999]"
                role="listbox"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t("nav.language")}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    role="option"
                    aria-selected={currentLang.code === l.code}
                    onClick={() => changeLanguage(l.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                      currentLang.code === l.code
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-primary-600"
                    }`}
                  >
                    <span>
                      {l.nativeName}{" "}
                      <span className="text-slate-400 text-xs">({l.label})</span>
                    </span>
                    {currentLang.code === l.code && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth controls */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isAuthority
                    ? "bg-accent-50 text-accent-700 border-accent-200"
                    : "bg-primary-50 text-primary-700 border-primary-200"
                }`}
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                {isAuthority
                  ? isTamil ? "அதிகாரி" : "Authority"
                  : isTamil ? "விவசாயி" : "Farmer"}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <>
              <Button to="/farmer-login" variant="outline" size="sm">
                {t("nav.login")}
              </Button>
              <Button to="/register" variant="primary" size="sm" icon={LayoutDashboard}>
                {t("nav.getStarted")}
              </Button>
            </>
          )}
        </div>

        {/* ── Mobile controls ── */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Quick language toggle pill */}
          <button
            onClick={() => changeLanguage(currentLang.code === "en" ? "ta" : "en")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-primary-600" />
            {currentLang.code === "en" ? "தமிழ்" : "English"}
          </button>

          <button
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-md">
          <div className="container-page py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    isActive && link.to !== "/#features"
                      ? "text-primary-700 bg-primary-50"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
                end={link.to === "/"}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Mobile language picker */}
            <div className="mt-2 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 px-3.5 mb-2 uppercase">
                {t("nav.language")}
              </p>
              <div className="flex gap-2 px-3.5 mb-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      changeLanguage(l.code);
                      setMobileOpen(false);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                      currentLang.code === l.code
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile auth */}
            {currentUser ? (
              <div className="flex items-center justify-between px-3.5 py-3 border-t border-slate-100">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    isAuthority
                      ? "bg-accent-50 text-accent-700 border-accent-200"
                      : "bg-primary-50 text-primary-700 border-primary-200"
                  }`}
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  {isAuthority
                    ? isTamil ? "அதிகாரி" : "Authority"
                    : isTamil ? "விவசாயி" : "Farmer"}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  to="/farmer-login"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.login")}
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.getStarted")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
