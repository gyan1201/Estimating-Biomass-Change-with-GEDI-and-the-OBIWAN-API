import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom emoji icons to avoid Vite asset bundling issues
const createIcon = (emoji) => L.divIcon({
  html: `<div style="font-size: 24px; background: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
  className: 'custom-hotspot-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const icons = {
  loss: createIcon('🔥'),
  gain: createIcon('🌱'),
  mixed: createIcon('🔄')
};

const HOTSPOTS = [
  {
    id: 1,
    name: "Mobile Delta Deforestation",
    type: "loss",
    lat: 31.05,
    lng: -88.0,
    desc: "Significant biomass loss due to timber harvesting or natural events.",
    points: [[31.1, -88.1], [31.1, -87.9], [30.9, -87.9], [30.9, -88.1]]
  },
  {
    id: 2,
    name: "Talladega Regrowth Edge",
    type: "gain",
    lat: 33.4,
    lng: -85.8,
    desc: "Rapid regeneration and biomass gain along the national forest boundary.",
    points: [[33.45, -85.85], [33.45, -85.75], [33.35, -85.75], [33.35, -85.85]]
  },
  {
    id: 3,
    name: "Black Belt Agricultural Shift",
    type: "mixed",
    lat: 32.3,
    lng: -87.0,
    desc: "Dynamic change zone with active land-use conversion.",
    points: [[32.35, -87.05], [32.35, -86.95], [32.25, -86.95], [32.25, -87.05]]
  }
];

export function HotspotMarkers({ onSelect }) {
  return (
    <>
      {HOTSPOTS.map(h => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={icons[h.type]}>
          <Popup>
            <div style={{ padding: '4px', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                {h.type === 'loss' ? '🔥' : h.type === 'gain' ? '🌱' : '🔄'} {h.name}
              </strong>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{h.desc}</p>
              {onSelect && (
                <button 
                  onClick={() => onSelect(h)}
                  style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                >
                  Analyze Zone
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
