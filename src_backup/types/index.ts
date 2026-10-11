export type ManureType = 'liquid' | 'solid';

export interface Reading {
  id: number;
  device_id: number;
  timestamp: string;
  manure_type: ManureType;
  ph: number | null;
  nitrogen_pct: number | null;
  phosphorus_pct: number | null;
  potassium_pct: number | null;
  moisture_pct: number | null;
  temperature_c: number | null;
  organic_carbon_pct: number | null;
  npk_index: number | null;
  source: string;
  is_synthetic: boolean;
}

export interface ReadingInput {
  device_id: number;
  manure_type: ManureType;
  ph: number;
  nitrogen_pct: number;
  phosphorus_pct: number;
  potassium_pct: number;
  moisture_pct: number;
  temperature_c: number;
  organic_carbon_pct: number;
}

export interface FarmerStats {
  liquid_ph: number;
  solid_moisture_pct: number;
  temperature_c: number;
  npk_index: number;
  organic_carbon_pct: number;
}

export interface CropAlternative {
  crop: string;
  confidence: number;
}

export interface PredictionResponse {
  recommended_crop: string;
  confidence: number;
  alternatives: CropAlternative[];
  npk_index: number;
  input_features: Record<string, number>;
  data_provenance: string;
  provenance_detail: string;
  method: string;
}

export interface AuthorityOverview {
  filter_district: string;
  registered_farmers_count: number;
  active_devices_count: number;
  total_readings_count: number;
  quality_alerts_count: number;
  districts_covered: string[];
  districts_count: number;
}

export interface AuthorityFarmer {
  id: number;
  email: string;
  district: string;
  device_count: number;
  status: 'Good' | 'Attention';
  predicted_crop: string;
  latest_reading_time: string | null;
}

export interface AuthorityReadingItem {
  id: number;
  timestamp: string | null;
  device_id: number;
  farmer_email: string;
  district: string;
  manure_type: string;
  source: string;
  ph: number | null;
  nitrogen_pct: number | null;
  phosphorus_pct: number | null;
  potassium_pct: number | null;
  moisture_pct: number | null;
  temperature_c: number | null;
  organic_carbon_pct: number | null;
  npk_index: number | null;
  is_synthetic: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  role: 'farmer' | 'authority';
  district?: string;
  token?: string;
}

export interface DeviceInfo {
  device_id: number;
  api_key: string;
  owner_id: number;
}
