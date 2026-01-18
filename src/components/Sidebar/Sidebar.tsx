import { useState } from 'react';
import { useBosData } from '../../hooks/useBosData';
import { LayerToggles } from './LayerToggles';
import { EpisodeSelector } from './EpisodeSelector';
import { ImportExport } from './ImportExport';
import { FeatureForm } from '../FeatureForm/FeatureForm';

export function Sidebar() {
  const { state, setEditingFeature } = useBosData();
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  const handleCloseForm = () => {
    setShowFeatureForm(false);
    setEditingFeature(null);
  };

  const isFormOpen = showFeatureForm || state.editingFeature !== null;

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

      {isFormOpen && (
        <FeatureForm
          editingFeature={state.editingFeature}
          onClose={handleCloseForm}
        />
      )}
    </aside>
  );
}
