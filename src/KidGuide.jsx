import React from 'react';
import './KidGuide.css';

// Absolute path to the generated illustration (saved as an artifact).
const illustrationSrc = 'file:///C:/Users/sharm/.gemini/antigravity-ide/brain/cc205461-8a2d-4ece-8191-162b795b97ca/kid_forest_illustration_1780793962810.png';

export default function KidGuide({ onClose }) {
  return (
    <div className="kidguide-root glass">
      <button className="kidguide-close" onClick={onClose}>✕</button>
      <h2 className="kidguide-title">🌳 Forest Explorer</h2>
      <p className="kidguide-intro">
        Welcome, young explorer! This map shows how many trees are growing in Alabama.
        Green = lots of trees, red = fewer trees. Use the slider to travel through years
        and see how the forest changes.
      </p>
      <img className="kidguide-illust" src={illustrationSrc} alt="Cartoon forest illustration" />
      <ul className="kidguide-tips">
        <li>🚁 Click the <strong>✈ Alabama</strong> button to fly straight to the forest.</li>
        <li>✏️ Draw a shape on the left map – the same shape appears on the right map.</li>
        <li>🕹️ Press the <strong>▶ Animate Biomass Years</strong> button to watch a fast‑forward movie of the forest.</li>
        <li>🔎 Hover over the bars in the timeline to see the exact amount of tree weight for each year.</li>
      </ul>
    </div>
  );
}
