import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sprout,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const SOCIALS = [
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Instagram, label: "Instagram" },
];

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.cropPrediction"), to: "/crop-prediction" },
    { label: t("nav.reports"), to: "/reports" },
    { label: t("farmerDashboard.title"), to: "/farmer-dashboard" },
    { label: t("authorityDashboard.title"), to: "/authority-dashboard" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-24">
      <div className="container-page py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </span>
            <span className="font-display font-bold text-white text-[15px]">
              {t("footer.brandTitle")}
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("footer.desc")}
          </p>
          <div className="flex items-center gap-2 mt-5">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-colors duration-200"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">{t("footer.quickLinks")}</h4>
          <ul className="space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-400 hover:text-primary-400 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">{t("footer.contact")}</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
              {t("footer.location")}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 shrink-0 text-primary-400" />
              contact@smartmanure.gov.in
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 shrink-0 text-primary-400" />
              +91 8189939056
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">
            {t("footer.focus")}
          </h4>
          <div className="bg-slate-800/60 rounded-xl p-4 mb-3">
            <p className="text-xs text-slate-400">
              {t("footer.focusDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} {t("footer.rights")}
          </p>
          <p>{t("nav.tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
