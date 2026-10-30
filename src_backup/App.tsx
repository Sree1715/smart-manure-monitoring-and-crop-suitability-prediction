import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TelemetryTab } from './components/TelemetryTab';
import { PredictionTab } from './components/PredictionTab';
import { AuthorityTab } from './components/AuthorityTab';
import { DeviceSimulatorTab } from './components/DeviceSimulatorTab';
import { AuthModal } from './components/AuthModal';
import { Reading, FarmerStats, UserProfile } from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'predict' | 'authority' | 'devices'>('telemetry');
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [selectedReadingForPrediction, setSelectedReadingForPrediction] = useState<Reading | null>(null);

  // Default initial active user (Farmer persona)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 1,
    email: 'ramesh.kumar@farm.in',
    role: 'farmer',
    district: 'Ludhiana',
  });

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [health, readList, statRes] = await Promise.all([
        api.checkHealth().catch(() => ({ status: 'offline' })),
        api.getReadings(30),
        api.getStats(),
      ]);

      setBackendHealthy(health.status === 'healthy');
      setReadings(readList);
      setStats(statRes);
    } catch (err) {
      console.warn('Network refresh error:', err);
      setBackendHealthy(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll telemetry every 15s
    return () => clearInterval(interval);
  }, []);

  const handleSelectForPrediction = (reading: Reading) => {
    setSelectedReadingForPrediction(reading);
    setActiveTab('predict');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        backendHealthy={backendHealthy}
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'telemetry' && (
          <TelemetryTab
            readings={readings}
            stats={stats}
            onSelectForPrediction={handleSelectForPrediction}
            onRefresh={fetchData}
            activeDeviceId={currentUser.id}
          />
        )}

        {activeTab === 'predict' && (
          <PredictionTab initialReading={selectedReadingForPrediction} />
        )}

        {activeTab === 'authority' && (
          <AuthorityTab />
        )}

        {activeTab === 'devices' && (
          <DeviceSimulatorTab
            onReadingIngested={fetchData}
            activeDeviceId={currentUser.id}
          />
        )}
      </main>

      {/* Authentication / Persona Switcher Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          // If switching to authority, auto-switch tab to authority
          if (user.role === 'authority') {
            setActiveTab('authority');
          } else {
            setActiveTab('telemetry');
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">GOBARdhan Agro Intelligence</span>
            <span>•</span>
            <span>IoT Sensors & Random Forest Scikit-Learn Model</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Port: <strong className="text-emerald-400">8000</strong></span>
            <span>Vite Port: <strong className="text-cyan-400">3001</strong></span>
            <span>Database: <strong className="text-purple-400">SQLite</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
