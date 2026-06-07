// OBIWAN API Client
// Base URL routes through Vite proxy → https://obiwan-alabama-api-5026633953.us-west1.run.app

const API_URL = 'https://obiwan-alabama-api-5026633953.us-west1.run.app';
const BASE = import.meta.env.DEV ? '/api' : API_URL;

async function apiFetch(path, options = {}) {
  const url = `${BASE}/${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OBIWAN API Error (${res.status}): ${errText}`);
  }
  return res.json();
}

const api = {
  // GET /biomass_map/{year}?use_calibration=bool → { url: tileUrl }
  getBiomassMap: (year, useCalibration = false) =>
    apiFetch(`biomass_map/${year}?use_calibration=${useCalibration}`),

  // GET /change_map/{start}/{end}?use_calibration=bool → { url: tileUrl }
  getChangeMap: (startYear, endYear, useCalibration = false) =>
    apiFetch(`change_map/${startYear}/${endYear}?use_calibration=${useCalibration}`),

  // POST /estimate_biomass_state_geojson/{year}?use_calibration=bool
  // → { AGBD, area_ha, asset_version, stdAGBD, use_calibration, year }
  estimateStock: (year, aoi, useCalibration = false) =>
    apiFetch(`estimate_biomass_state_geojson/${year}?use_calibration=${useCalibration}`, {
      method: 'POST', body: JSON.stringify(aoi),
    }),

  // POST /estimate_biomass_change_geojson/{start}/{end}?use_calibration=bool
  // → { start_year, end_year, asset_version, use_calibration, area_ha, dAGBD, stddAGBD }
  estimateChange: (startYear, endYear, aoi, useCalibration = false) =>
    apiFetch(`estimate_biomass_change_geojson/${startYear}/${endYear}?use_calibration=${useCalibration}`, {
      method: 'POST', body: JSON.stringify(aoi),
    }),

  // POST /annual_biomass_state_geojson?use_calibration=bool
  // → array of { AGBD, area_ha, stdAGBD, Year }
  annualStock: (aoi, useCalibration = false) =>
    apiFetch(`annual_biomass_state_geojson?use_calibration=${useCalibration}`, {
      method: 'POST', body: JSON.stringify(aoi),
    }),

  // POST /estimate_biomass_additionality_geojson/{bStart}/{bEnd}/{tStart}/{tEnd}?use_calibration=bool
  estimateAdditionality: (baseStart, baseEnd, targetStart, targetEnd, aoi, useCalibration = false) =>
    apiFetch(
      `estimate_biomass_additionality_geojson/${baseStart}/${baseEnd}/${targetStart}/${targetEnd}?use_calibration=${useCalibration}`,
      { method: 'POST', body: JSON.stringify(aoi) }
    ),
};

export default api;
