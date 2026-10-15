import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const info = [
    { icon: Mail, label: t("contact.emailLabel"), value: "contact@smartmanure.gov.in" },
    { icon: Phone, label: t("contact.phoneLabel"), value: "+91 8189939056" },
    { icon: MapPin, label: t("contact.officeLabel"), value: t("contact.officeValue") },
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container-page section-padding">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="badge bg-primary-50 text-primary-700 mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" /> {t("contact.badge")}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900">
          {t("contact.title")}
        </h1>
        <p className="text-slate-600">
          {t("contact.desc")}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {info.map((i) => (
            <div
              key={i.label}
              className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex items-start gap-4"
            >
              <span className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <i.icon className="w-5 h-5 text-primary-600" />
              </span>
              <div>
                <p className="text-xs text-slate-400">{i.label}</p>
                <p className="text-sm font-medium text-slate-800">{i.value}</p>
              </div>
            </div>
          ))}
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
            <p className="font-semibold mb-1.5">{isTamil ? "அரசு வேளாண் உதவி" : "Government Support"}</p>
            <p className="text-sm text-white/85">
              {isTamil
                ? "விவசாய ஆதரவு கேள்விகளுக்கு, உங்கள் மாவட்ட அலுவலகத்தை நேரடியாக தொடர்பு கொள்ளவும்."
                : "For agricultural support queries, contact your district office directly."}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-14 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isTamil ? "செய்தி அனுப்பப்பட்டது" : "Message Sent"}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {t("contact.sentSuccess")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => setSent(false)}
              >
                {isTamil ? "மற்றொரு செய்தியை அனுப்பவும்" : "Send Another Message"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={t("contact.formName")}
                  name="name"
                  placeholder={isTamil ? "உங்கள் பெயர்" : "Your name"}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label={t("contact.formEmail")}
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <Input
                label={t("contact.formSubject")}
                name="subject"
                placeholder={isTamil ? "நாங்கள் உங்களுக்கு எவ்வாறு உதவ முடியும்?" : "How can we help?"}
                value={form.subject}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t("contact.formMessage")}
                </label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder={isTamil ? "உங்கள் செய்தியை இங்கே உள்ளிடவும்..." : "Write your message here..."}
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 py-2.5 px-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-colors duration-200 resize-none"
                />
              </div>
              <Button type="submit" size="lg" icon={Send} iconPosition="right">
                {t("contact.sendBtn")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
