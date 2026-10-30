import React from "react";
import { Link } from "react-router-dom";
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

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Crop Prediction", to: "/crop-prediction" },
  { label: "Reports", to: "/reports" },
  { label: "Farmer Dashboard", to: "/farmer-dashboard" },
  { label: "Authority Dashboard", to: "/authority-dashboard" },
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook" },
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Instagram, label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-24">
      <div className="container-page py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </span>
            <span className="font-display font-bold text-white text-[15px]">
              Smart Manure Monitor
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            An IoT and AI powered platform for monitoring liquid and solid
            organic manure quality and predicting the most suitable crops.
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
          <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
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
          <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
              Karur, Tamil Nadu
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
            Platform Focus
          </h4>
          <div className="bg-slate-800/60 rounded-xl p-4 mb-3">
            <p className="text-xs text-slate-400">
              Smart monitoring and crop recommendations powered by real-time
              manure data.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Smart Manure Monitor. All rights
            reserved.
          </p>
          <p>Smart agriculture insights</p>
        </div>
      </div>
    </footer>
  );
}
