import { useBosData } from '../../hooks/useBosData';
import { LayerToggles } from './LayerToggles';
import { EpisodeSelector } from './EpisodeSelector';
import { ImportExport } from './ImportExport';
import { FeatureForm } from '../FeatureForm/FeatureForm';

interface SidebarProps {
  showFeatureForm: boolean;
  onOpenFeatureForm: () => void;
  onCloseFeatureForm: () => void;
}

export function Sidebar({
  showFeatureForm,
  onOpenFeatureForm,
  onCloseFeatureForm,
}: SidebarProps) {
  const { state, setEditingFeature } = useBosData();

  const handleCloseForm = () => {
    onCloseFeatureForm();
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
          <button className="btn btn-primary" onClick={onOpenFeatureForm}>
            Add Feature
          </button>
          <p className="help-text shortcut-hint">Press N to add a feature</p>
        </div>

        <ImportExport />

        <div className="sidebar-section">
          <h3>Keyboard Shortcuts</h3>
          <ul className="shortcuts-list">
            <li><kbd>1</kbd>-<kbd>4</kbd> Toggle layers</li>
            <li><kbd>N</kbd> New feature</li>
            <li><kbd>Esc</kbd> Cancel</li>
          </ul>
        </div>
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
