import { useState } from 'react';
import { BosProvider } from './hooks/useBosData';
import { DrawingProvider } from './hooks/useDrawing';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapContainer } from './components/Map/MapContainer';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';

function App() {
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  return (
    <BosProvider>
      <DrawingProvider>
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
      </DrawingProvider>
    </BosProvider>
  );
}

export default App;
