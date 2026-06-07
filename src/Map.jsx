import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AnimationPlayer from './AnimationPlayer.jsx';
import './Map.css';

// Alabama center coordinates
const ALABAMA = [32.806671, -86.791130];

// Button inside the map to fly to Alabama
function FlyToAlabama() {
  const map = useMap();
  return (
    <div
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
      onClick={() => map.flyTo(ALABAMA, 8, { duration: 1.5 })}
    >
      <button className="map-btn primary">
        ✈ Fly to Alabama
      </button>
    </div>
  );
}

// Overlay for biomass tiles coming from the API — hidden when animation is active
function BiomassTileLayer({ url, hidden }) {
  if (!url || hidden) return null;
  return <TileLayer url={url} opacity={0.55} zIndex={5} />;
}

// Click-to-draw polygon tool
function DrawTool({ onFinish, drawing, setDrawing }) {
  const [points, setPoints] = useState([]);

  useMapEvents({
    click(e) {
      if (!drawing) return;
      const newPts = [...points, [e.latlng.lat, e.latlng.lng]];
      setPoints(newPts);
    },
    contextmenu(e) {
      if (!drawing || points.length < 3) return;
      const coords = [...points.map(p => [p[1], p[0]]), [points[0][1], points[0][0]]];
      const featureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }],
      };
      onFinish(featureCollection, points);
      setPoints([]);
      setDrawing(false);
      e.originalEvent.preventDefault();
    },
  });

  if (points.length < 2) return null;
  return (
    <Polygon
      positions={points}
      pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.25, weight: 2, dashArray: '6,4' }}
    />
  );
}

// ── SYNC LOGIC (Lifted from CompareMap) ──
function SyncSecondary({ primaryRef }) {
  const map = useMap();
  useEffect(() => {
    const primary = primaryRef.current;
    if (!primary) return;
    map.setView(primary.getCenter(), primary.getZoom(), { animate: false });
  }, []);
  return null;
}

function SyncPrimary({ secondaryRef }) {
  const map = useMap();
  useMapEvents({
    move() {
      const sec = secondaryRef.current;
      if (!sec) return;
      sec.setView(map.getCenter(), map.getZoom(), { animate: false });
    },
  });
  return null;
}

function SyncBack({ primaryRef }) {
  const map = useMap();
  useMapEvents({
    move() {
      const pri = primaryRef.current;
      if (!pri) return;
      pri.setView(map.getCenter(), map.getZoom(), { animate: false });
    },
  });
  return null;
}


export default function Map({ onAoiChange, biomassUrl, changeMapUrl, useCalibration }) {
  const [drawing, setDrawing] = useState(false);
  const [finishedPoints, setFinishedPoints] = useState(null);
  
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);

  const handleFinish = useCallback((featureCollection, pts) => {
    setFinishedPoints(pts);
    onAoiChange(featureCollection);
  }, [onAoiChange]);

  const clearAoi = () => {
    setFinishedPoints(null);
    setDrawing(false);
    onAoiChange(null);
  };

  return (
    <div className="map-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
      <AnimationPlayer useCalibration={useCalibration} onAnimating={() => {}}>
        {({ mode, currentUrl, tileCache, currentYear, validYears }) => {
          
          const isSplitView = mode === 'ready' || mode === 'loading';

          return (
            <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
              
              {/* Controls Overlay (Only visible in normal mode or when drawing) */}
              {!isSplitView && (
                <div className="map-controls" style={{ position: 'absolute', zIndex: 1000, top: 12, left: 12 }}>
                  {!drawing && !finishedPoints && (
                    <button className="map-btn primary" onClick={() => setDrawing(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      Draw AOI
                    </button>
                  )}
                  {drawing && (
                    <span className="map-hint">
                      Left-click to add points · Right-click to finish ({'>'}2 points needed)
                    </span>
                  )}
                  {finishedPoints && (
                    <button className="map-btn danger" onClick={clearAoi}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Clear Selection
                    </button>
                  )}
                </div>
              )}

              {/* ── SPLIT VIEW ── */}
              {isSplitView ? (
                <div className="compare-maps" style={{ width: '100%', height: '100%', display: 'flex' }}>
                  {/* Left Map: Bare Satellite */}
                  <div className="map-half left-half" style={{ flex: 1, position: 'relative' }}>
                    <div className="map-badge left-badge" style={{ position: 'absolute', zIndex: 1000, top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 'bold' }}>
                      🛰️ Present Satellite View
                    </div>
                    <MapContainer center={ALABAMA} zoom={6} zoomControl={true} style={{ width: '100%', height: '100%' }} ref={primaryRef}>
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
                      <SyncPrimary secondaryRef={secondaryRef} />
                      <FlyToAlabama />
                      {finishedPoints && <Polygon positions={finishedPoints} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }} />}
                    </MapContainer>
                  </div>

                  <div className="compare-divider" style={{ width: '4px', background: '#334155', zIndex: 1000 }}></div>

                  {/* Right Map: Satellite + Animated Biomass */}
                  <div className="map-half right-half" style={{ flex: 1, position: 'relative' }}>
                    <div className="map-badge right-badge" style={{ position: 'absolute', zIndex: 1000, top: 10, right: 10, background: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 'bold' }}>
                      🌳 Biomass Animation
                    </div>
                    <MapContainer center={ALABAMA} zoom={6} zoomControl={false} style={{ width: '100%', height: '100%' }} ref={secondaryRef}>
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
                      
                      {/* PRE-RENDER ALL TILES CONCURRENTLY AT 0 OPACITY TO FORCE BROWSER CACHING! */}
                      {mode === 'ready' && validYears.map(y => (
                        <TileLayer key={y} url={tileCache[y]} opacity={y === currentYear ? 0.65 : 0} zIndex={10} />
                      ))}

                      <SyncSecondary primaryRef={primaryRef} />
                      <SyncBack primaryRef={primaryRef} />
                      {finishedPoints && <Polygon positions={finishedPoints} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }} />}
                    </MapContainer>
                  </div>
                </div>
              ) : (
                /* ── NORMAL SINGLE MAP ── */
                <MapContainer center={ALABAMA} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri World Imagery" />
                  <FlyToAlabama />
                  <BiomassTileLayer url={biomassUrl} hidden={false} />
                  {changeMapUrl && <TileLayer url={changeMapUrl} opacity={0.7} zIndex={6} />}
                  <DrawTool onFinish={handleFinish} drawing={drawing} setDrawing={setDrawing} />
                  {finishedPoints && <Polygon positions={finishedPoints} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2, weight: 2 }} />}
                </MapContainer>
              )}
            </div>
          );
        }}
      </AnimationPlayer>
    </div>
  );
}
