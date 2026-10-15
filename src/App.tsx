import React, { useMemo, useState } from 'react';
import { locations, missions } from './data';

export default function App() {
  const [selectedId, setSelectedId] = useState(locations[0].id);
  const [note, setNote] = useState('Hoy Ari ha decidido explorar el barrio y dejar una huella alegre en cada rincón.');

  const selected = useMemo(
    () => locations.find((item) => item.id === selectedId) ?? locations[0],
    [selectedId],
  );

  return (
    <div className="game-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Nuestra aventura</p>
          <h1>El Barrio de Peanuts</h1>
        </div>
        <div className="badge">Ari guía el paseo</div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <h2>Explora</h2>
          <div className="map-grid">
            {locations.map((location) => (
              <button
                key={location.id}
                className={`location-card ${selectedId === location.id ? 'active' : ''}`}
                style={{ ['--accent' as string]: location.accent }}
                onClick={() => setSelectedId(location.id)}
                type="button"
              >
                <span className="emoji">{location.emoji}</span>
                <span>{location.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="content-panel">
          <div className="hero" style={{ ['--accent' as string]: selected.accent }}>
            <div className="hero-copy">
              <p className="scene-label">Ahora mismo</p>
              <h2>
                {selected.emoji} {selected.name}
              </h2>
              <p>{selected.description}</p>
              <div className="mood-chip">{selected.mood}</div>
            </div>

            <div className="scene-card">
              <span>Qué hacer</span>
              <ul>
                {selected.activities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lower-grid">
            <div className="panel-box">
              <h3>Misiones del día</h3>
              <ul className="mission-list">
                {missions.map((mission, index) => (
                  <li key={mission}>
                    <span>{index + 1}</span>
                    {mission}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-box">
              <h3>Cuaderno</h3>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                aria-label="Cuaderno de Ari"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
