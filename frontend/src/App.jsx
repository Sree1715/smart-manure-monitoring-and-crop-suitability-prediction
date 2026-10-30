import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";

import Home from "./pages/Home.jsx";
import FarmerLogin from "./pages/FarmerLogin.jsx";
import AuthorityLogin from "./pages/AuthorityLogin.jsx";
import Register from "./pages/Register.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import AuthorityDashboard from "./pages/AuthorityDashboard.jsx";
import CropPrediction from "./pages/CropPrediction.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/farmer-login" element={<FarmerLogin />} />
        <Route path="/authority-login" element={<AuthorityLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/authority-dashboard" element={<AuthorityDashboard />} />
        <Route path="/crop-prediction" element={<CropPrediction />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
