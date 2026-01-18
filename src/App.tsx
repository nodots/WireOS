import { BosProvider } from './hooks/useBosData';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapContainer } from './components/Map/MapContainer';

function App() {
  return (
    <BosProvider>
      <div className="app">
        <Sidebar />
        <MapContainer />
      </div>
    </BosProvider>
  );
}

export default App;
