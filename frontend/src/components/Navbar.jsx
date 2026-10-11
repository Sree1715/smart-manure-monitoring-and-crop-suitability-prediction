import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Menu,
  X,
  Sprout,
  Globe,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import Button from "./Button.jsx";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "Dashboard", to: "/farmer-dashboard" },
  { label: "Crop Prediction", to: "/crop-prediction" },
  { label: "Reports", to: "/reports" },
  { label: "Contact", to: "/contact" },
];

const LANGUAGES = ["English", "हिंदी", "मराठी", "ਪੰਜਾਬੀ", "தமிழ்"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("English");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-soft"
          : "bg-white/70 backdrop-blur-sm"
      } border-b border-slate-100`}
    >
      <nav className="container-page flex items-center justify-between h-16 md:h-[70px]">
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
              Organic agriculture insights
            </span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
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

        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Globe className="w-4 h-4" />
              {lang}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-card-hover border border-slate-100 py-1.5 animate-fade-in">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-700"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button to="/farmer-login" variant="outline" size="sm">
            Login
          </Button>
          <Button
            to="/register"
            variant="primary"
            size="sm"
            icon={LayoutDashboard}
          >
            Get Started
          </Button>
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white animate-slide-up">
          <div className="container-page py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
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
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <Button
                to="/farmer-login"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Button>
              <Button
                to="/register"
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
