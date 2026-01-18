import { useState } from 'react';
import { LayerToggles } from './LayerToggles';
import { EpisodeSelector } from './EpisodeSelector';
import { ImportExport } from './ImportExport';
import { FeatureForm } from '../FeatureForm/FeatureForm';

export function Sidebar() {
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>WireOS</h1>
        <p className="subtitle">Baltimore Operating System</p>
      </div>

      <div className="sidebar-content">
        <EpisodeSelector />
        <LayerToggles />

        <div className="sidebar-section">
          <button
            className="btn btn-primary"
            onClick={() => setShowFeatureForm(true)}
          >
            Add Feature
          </button>
        </div>

        <ImportExport />
      </div>

      {showFeatureForm && (
        <FeatureForm onClose={() => setShowFeatureForm(false)} />
      )}
    </aside>
  );
}
