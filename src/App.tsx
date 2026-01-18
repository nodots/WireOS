import { useState } from 'react';
import { BosProvider } from './hooks/useBosData';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapContainer } from './components/Map/MapContainer';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';

function App() {
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  return (
    <BosProvider>
      <KeyboardShortcutsProvider
        onOpenFeatureForm={() => setShowFeatureForm(true)}
      >
        <div className="app">
          <Sidebar
            showFeatureForm={showFeatureForm}
            onOpenFeatureForm={() => setShowFeatureForm(true)}
            onCloseFeatureForm={() => setShowFeatureForm(false)}
          />
          <MapContainer />
        </div>
      </KeyboardShortcutsProvider>
    </BosProvider>
  );
}

export default App;
