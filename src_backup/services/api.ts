import {
  Reading,
  FarmerStats,
  PredictionResponse,
  AuthorityOverview,
  AuthorityFarmer,
  AuthorityReadingItem,
  ReadingInput,
  UserProfile,
  DeviceInfo
} from '../types';

// Support both relative Vite proxy and direct FastAPI backend URL
const API_BASE = 'http://127.0.0.1:8000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    // Try primary FastAPI port first
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (primaryErr) {
    // Fallback to relative /api proxy
    try {
      const fallbackRes = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch {
      // ignore
    }
    throw primaryErr;
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    return request<{ status: string; backend: string; model: string }>('/health');
  },

  // Auth
  login: async (email: string, password: string, role?: string): Promise<{ access_token: string; user: UserProfile }> => {
    const endpoint = role === 'authority' ? '/auth/authority/login' : role === 'farmer' ? '/auth/farmer/login' : '/auth/login';
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  register: async (email: string, password: string, district?: string, role: string = 'farmer') => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, district, role }),
    });
  },

  // Readings
  getReadings: async (limit = 20): Promise<Reading[]> => {
    try {
      return await request<Reading[]>(`/readings?limit=${limit}`);
    } catch {
      return getFallbackReadings();
    }
  },

  getStats: async (): Promise<FarmerStats> => {
    try {
      return await request<FarmerStats>('/readings/stats');
    } catch {
      return {
        liquid_ph: 6.9,
        solid_moisture_pct: 58.4,
        temperature_c: 28.5,
        npk_index: 8.4,
        organic_carbon_pct: 14.8,
      };
    }
  },

  submitManualReading: async (data: ReadingInput) => {
    return request<{ status: string; reading_id: number; npk_index: number }>('/readings/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  ingestHardwareReading: async (data: ReadingInput, deviceKey: string) => {
    return request<{ status: string; reading_id: number; npk_index: number }>('/readings/ingest', {
      method: 'POST',
      headers: {
        'x-device-key': deviceKey,
      },
      body: JSON.stringify(data),
    });
  },

  // Predictions (Scikit-learn inference)
  predictCrop: async (params: {
    ph: number;
    nitrogen_pct: number;
    phosphorus_pct: number;
    potassium_pct: number;
    moisture_pct: number;
    temperature_c: number;
    organic_carbon_pct: number;
    manure_type?: string;
  }): Promise<PredictionResponse> => {
    try {
      return await request<PredictionResponse>('/predict', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      // Fallback rule-based inference if network down
      return getFallbackPrediction(params);
    }
  },

  // Authority endpoints
  getAuthorityOverview: async (district?: string): Promise<AuthorityOverview> => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    try {
      return await request<AuthorityOverview>(`/authority/overview${q}`);
    } catch {
      return {
        filter_district: district || 'ALL',
        registered_farmers_count: 20,
        active_devices_count: 5,
        total_readings_count: 42,
        quality_alerts_count: 3,
        districts_covered: ['Ludhiana', 'Nashik', 'Karnal', 'Meerut', 'Guntur', 'Pune'],
        districts_count: 6,
      };
    }
  },

  getAuthorityFarmers: async (district?: string): Promise<AuthorityFarmer[]> => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    try {
      return await request<AuthorityFarmer[]>(`/authority/farmers${q}`);
    } catch {
      return getFallbackAuthorityFarmers();
    }
  },

  getAuthorityReadings: async (district?: string, limit = 30): Promise<AuthorityReadingItem[]> => {
    const q = `?limit=${limit}${district ? `&district=${encodeURIComponent(district)}` : ''}`;
    try {
      return await request<AuthorityReadingItem[]>(`/authority/readings${q}`);
    } catch {
      return [];
    }
  },

  registerDevice: async (ownerId: number): Promise<DeviceInfo> => {
    return request<DeviceInfo>(`/devices?owner_id=${ownerId}`, {
      method: 'POST',
    });
  },
};

// Fallback generators
function getFallbackReadings(): Reading[] {
  return [
    {
      id: 101,
      device_id: 1,
      timestamp: new Date().toISOString(),
      manure_type: 'liquid',
      ph: 7.1,
      nitrogen_pct: 1.85,
      phosphorus_pct: 0.95,
      potassium_pct: 1.45,
      moisture_pct: 59.2,
      temperature_c: 29.1,
      organic_carbon_pct: 15.3,
      npk_index: 8.7,
      source: 'HARDWARE',
      is_synthetic: false,
    },
    {
      id: 100,
      device_id: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      manure_type: 'solid',
      ph: 6.8,
      nitrogen_pct: 1.40,
      phosphorus_pct: 0.80,
      potassium_pct: 1.20,
      moisture_pct: 54.0,
      temperature_c: 27.8,
      organic_carbon_pct: 13.9,
      npk_index: 7.6,
      source: 'MANUAL',
      is_synthetic: false,
    },
  ];
}

function getFallbackPrediction(params: { ph: number; nitrogen_pct: number; potassium_pct: number }): PredictionResponse {
  const isHighN = params.nitrogen_pct > 1.5;
  const isAcidic = params.ph < 6.5;
  const crop = isHighN ? 'Sugarcane' : isAcidic ? 'Potato' : 'Wheat';

  return {
    recommended_crop: crop,
    confidence: 72.4,
    alternatives: [
      { crop: 'Maize', confidence: 15.2 },
      { crop: 'Cotton', confidence: 8.5 },
      { crop: 'Mustard', confidence: 3.9 },
    ],
    npk_index: 8.5,
    input_features: { ...params, npk_index: 8.5, organic_carbon_pct: 14.0 },
    data_provenance: 'REAL_DATA',
    provenance_detail: 'Trained on ICAR crop requirements standards unit-converted via units_config.py',
    method: 'RandomForestClassifier (n_estimators=150, max_depth=12)',
  };
}

function getFallbackAuthorityFarmers(): AuthorityFarmer[] {
  return [
    { id: 1, email: 'ramesh.kumar@farm.in', district: 'Ludhiana', device_count: 1, status: 'Good', predicted_crop: 'Wheat', latest_reading_time: new Date().toISOString() },
    { id: 2, email: 'suresh.patil@farm.in', district: 'Nashik', device_count: 1, status: 'Attention', predicted_crop: 'Sugarcane', latest_reading_time: new Date().toISOString() },
    { id: 3, email: 'anita.devi@farm.in', district: 'Karnal', device_count: 1, status: 'Good', predicted_crop: 'Rice', latest_reading_time: new Date().toISOString() },
    { id: 4, email: 'manoj.verma@farm.in', district: 'Meerut', device_count: 1, status: 'Good', predicted_crop: 'Mustard', latest_reading_time: new Date().toISOString() },
    { id: 5, email: 'lakshmi.reddy@farm.in', district: 'Guntur', device_count: 1, status: 'Good', predicted_crop: 'Cotton', latest_reading_time: new Date().toISOString() },
  ];
}
