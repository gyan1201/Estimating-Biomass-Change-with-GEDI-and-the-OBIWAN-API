import React, { useState } from 'react';
import './Glossary.css';

const TERMS = [
  {
    id: 'agbd',
    term: 'AGBD — Above Ground Biomass Density',
    emoji: '🌳',
    color: '#10B981',
    short: 'How much all the trees and plants above the soil weigh per hectare.',
    detail: `AGBD measures the total dry weight of all living plant material above the ground — trunks, branches, leaves, bark — in a given area. It's measured in Megagrams per hectare (Mg/ha). One megagram = 1 metric tonne. A dense tropical forest might have 300+ Mg/ha, while a young pine plantation might have 50 Mg/ha.`,
    kidExplain: `Imagine weighing every single tree, branch, and leaf in a football field. That total weight is the biomass! 🏈🌲`,
  },
  {
    id: 'gedi',
    term: 'GEDI — Global Ecosystem Dynamics Investigation',
    emoji: '🛰️',
    color: '#3B82F6',
    short: 'A NASA laser sensor on the International Space Station that measures tree heights from space.',
    detail: `GEDI is a full-waveform lidar instrument mounted on the ISS. It fires laser pulses down to Earth and measures how long they take to bounce back. By analyzing the return signal, it can determine forest canopy height, vertical structure, and estimate biomass. GEDI L4B is the gridded (1 km) biomass product used by OBIWAN.`,
    kidExplain: `It's like a flashlight on a spaceship that bounces light off trees to figure out how tall they are! 🔦🚀`,
  },
  {
    id: 'obiwan',
    term: 'OBIWAN API',
    emoji: '🌐',
    color: '#8B5CF6',
    short: 'The web service that gives us biomass maps, yearly estimates, and change data for Alabama.',
    detail: `OBIWAN (Observation-Based Inventory With Assimilated Networks) is a research API developed for Alabama. It provides six endpoints: biomass maps (tile URLs), annual AGBD estimates, biomass stock totals, biomass change between years, additional stock metrics, and additional change metrics. All data is derived from GEDI L4B observations combined with forest inventory calibration.`,
    kidExplain: `Think of it as a magic website that answers questions like "How many trees grew in Alabama this year?" 🧙‍♂️📊`,
  },
  {
    id: 'calibration',
    term: 'Inventory Calibration',
    emoji: '🎯',
    color: '#F59E0B',
    short: 'Correcting satellite measurements using real on-the-ground tree measurements.',
    detail: `Raw GEDI satellite estimates can have biases — underestimating dense forests and overestimating sparse ones. Inventory calibration adjusts these values using ground-truth data from the USDA Forest Service's FIA (Forest Inventory & Analysis) program. FIA crews physically visit thousands of forest plots, measure real trees (diameter, height, species), and calculate actual biomass. The calibration uses these real measurements to correct the satellite biases.`,
    kidExplain: `It's like checking your bathroom scale with a known weight before you step on it. Without checking, the number might be a little off! ⚖️`,
  },
  {
    id: 'fia',
    term: 'FIA — Forest Inventory & Analysis',
    emoji: '📋',
    color: '#EC4899',
    short: 'A USDA program where real people visit forests and measure trees by hand.',
    detail: `FIA is the nation's continuous forest census, run by the U.S. Forest Service. Field crews visit roughly 300,000+ permanent plots across the U.S. on a rotating basis, measuring every tree's diameter, height, species, and health condition. This data forms the ground-truth baseline that OBIWAN uses to calibrate satellite estimates.`,
    kidExplain: `Imagine scientists hiking into the forest with measuring tapes and clipboards, hugging trees to measure how wide they are! 🤗🌲`,
  },
  {
    id: 'aoi',
    term: 'AOI — Area of Interest',
    emoji: '✏️',
    color: '#F97316',
    short: 'The polygon you draw on the map to select the area you want to analyze.',
    detail: `An AOI is a user-defined geographic boundary (polygon) that tells the API which region to analyze. You draw it on the map by clicking points and right-clicking to finish. The API then calculates biomass statistics only within that polygon. AOIs must be within Alabama for the OBIWAN API to return valid results.`,
    kidExplain: `It's like drawing a shape with a crayon on a map and saying "Tell me about the trees inside this shape!" 🖍️`,
  },
  {
    id: 'mgha',
    term: 'Mg/ha — Megagrams per Hectare',
    emoji: '📏',
    color: '#06B6D4',
    short: 'The unit used to measure biomass density. 1 Mg = 1 metric tonne. 1 hectare ≈ 2.5 football fields.',
    detail: `This is the standard unit for reporting biomass density. One megagram (Mg) equals 1,000 kilograms or approximately 2,205 pounds. One hectare (ha) is 10,000 square meters — about 2.47 acres or roughly 2.5 American football fields. So "150 Mg/ha" means 150 tonnes of plant material per 2.5 football fields of land.`,
    kidExplain: `If a football field was covered in trees, Mg/ha tells you how many elephants all those trees would weigh! 🐘🏟️`,
  },
  {
    id: 'dagbd',
    term: 'dAGBD — Change in Biomass',
    emoji: '📈',
    color: '#22C55E',
    short: 'How much the biomass increased or decreased between two years.',
    detail: `dAGBD (delta-AGBD) is the difference in Above Ground Biomass Density between two time points. A positive dAGBD means the forest grew (more biomass), while a negative value means it lost biomass — due to logging, fires, disease, or natural mortality. The OBIWAN API calculates this by comparing GEDI observations between your selected start and end years.`,
    kidExplain: `It's like checking your height last year vs. this year. If you grew 2 inches, your "dHeight" is +2! Forests grow the same way 📏🌱`,
  },
  {
    id: 'stock',
    term: 'Biomass Stock',
    emoji: '🏦',
    color: '#A855F7',
    short: 'The total amount of biomass in your selected area at a single point in time.',
    detail: `While AGBD is a density (per hectare), biomass stock is the absolute total — density × area. If your AOI covers 1,000 hectares at 150 Mg/ha, the stock is 150,000 Mg (150 kilotonnes). The stock endpoint also returns the area in hectares and standard error, helping you understand how much total "forest weight" exists in your region.`,
    kidExplain: `If AGBD is how much candy is in one jar, stock is how much candy is in ALL the jars in your room! 🍬🍬🍬`,
  },
  {
    id: 'lidar',
    term: 'LiDAR — Light Detection and Ranging',
    emoji: '💡',
    color: '#EF4444',
    short: 'A technology that uses laser pulses to measure distances and create 3D maps.',
    detail: `LiDAR works by firing rapid laser pulses and measuring the time it takes for each pulse to bounce back from a surface. By analyzing millions of returns, it builds a detailed 3D point cloud of the terrain and vegetation. GEDI uses a specific type called "full-waveform LiDAR" which captures the entire shape of the return signal, revealing forest structure from canopy top to ground level.`,
    kidExplain: `Imagine a super-fast flashlight that blinks billions of times and measures how far away everything is — that's LiDAR! It can "see" through leaves to find the ground below 🔦🌿`,
  },
  {
    id: 'carbon',
    term: 'Carbon Storage',
    emoji: '💨',
    color: '#64748B',
    short: 'Trees absorb CO₂ from the air and store the carbon in their wood — roughly 50% of dry biomass is carbon.',
    detail: `Forests are critical carbon sinks. As trees photosynthesize, they pull CO₂ from the atmosphere and lock the carbon into their wood, roots, and soil. Approximately 47–50% of dry tree biomass is pure carbon. By measuring biomass, we can estimate how much carbon a forest stores and how much CO₂ would be released if it were destroyed. This is crucial for climate change mitigation.`,
    kidExplain: `Trees are like giant vacuum cleaners that suck up the bad air (CO₂) and turn it into wood! The more trees, the cleaner our air 🌬️🌳`,
  },
  {
    id: 'tileurl',
    term: 'Tile Map URL',
    emoji: '🗺️',
    color: '#0EA5E9',
    short: 'A web address pattern that loads small image tiles to build the biomass overlay on the map.',
    detail: `Web maps don't load one giant image — they use a grid of small 256×256 pixel tiles at different zoom levels. The OBIWAN API returns a URL template like "https://.../{z}/{x}/{y}.png" where z=zoom, x=column, y=row. Leaflet automatically fetches the right tiles as you pan and zoom, creating the colored biomass overlay you see on the satellite imagery.`,
    kidExplain: `Imagine a giant puzzle where each piece is a tiny picture. The map loads only the pieces you're looking at, so it's super fast! 🧩`,
  },
];

function TermCard({ term, isOpen, onToggle }) {
  return (
    <div className={`gterm-card ${isOpen ? 'open' : ''}`} style={{ '--accent': term.color }}>
      <button className="gterm-header" onClick={onToggle}>
        <span className="gterm-emoji">{term.emoji}</span>
        <div className="gterm-titles">
          <h3 className="gterm-name">{term.term}</h3>
          <p className="gterm-short">{term.short}</p>
        </div>
        <span className={`gterm-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="gterm-body">
          <div className="gterm-detail">
            <h4>📖 Full Explanation</h4>
            <p>{term.detail}</p>
          </div>
          <div className="gterm-kid">
            <h4>👶 Explain Like I'm 10</h4>
            <p>{term.kidExplain}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Glossary({ onClose }) {
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = TERMS.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.short.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glossary-root">
      {/* Header */}
      <div className="glossary-header glass">
        <div className="glossary-title-row">
          <div>
            <h2 className="glossary-title">📚 Project Glossary</h2>
            <p className="glossary-subtitle">Every key term explained — with kid-friendly versions too!</p>
          </div>
          <button className="glossary-close" onClick={onClose}>✕ Back to Dashboard</button>
        </div>
        <div className="glossary-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="glossary-search"
            type="text"
            placeholder="Search terms… (e.g. AGBD, calibration, carbon)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="glossary-stats">
          <span className="gstat">{TERMS.length} terms</span>
          <span className="gstat-sep">·</span>
          <span className="gstat">Click any card to expand</span>
          <span className="gstat-sep">·</span>
          <span className="gstat">Each term has a 👶 kid-friendly explanation</span>
        </div>
      </div>

      {/* Cards */}
      <div className="glossary-grid">
        {filtered.map(t => (
          <TermCard
            key={t.id}
            term={t}
            isOpen={openId === t.id}
            onToggle={() => setOpenId(openId === t.id ? null : t.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="glossary-empty">
            <p>🔎 No terms match "<strong>{search}</strong>"</p>
          </div>
        )}
      </div>
    </div>
  );
}
