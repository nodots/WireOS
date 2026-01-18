/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  BosFeature,
  BosFeatureCollection,
  BosLayer,
  DrawingMode,
  SessionAdditions,
} from '../types/bos';
import {
  createEmptyFeatureCollection,
  validateBosFeatureCollection,
} from '../utils/geojson';

interface BosState {
  data: BosFeatureCollection;
  visibleLayers: Record<BosLayer, boolean>;
  currentEpisode: string;
  drawingMode: DrawingMode;
  sessionAdditions: SessionAdditions;
  isLoading: boolean;
  error: string | null;
}

type BosAction =
  | { type: 'SET_DATA'; payload: BosFeatureCollection }
  | { type: 'ADD_FEATURE'; payload: BosFeature }
  | { type: 'TOGGLE_LAYER'; payload: BosLayer }
  | { type: 'SET_CURRENT_EPISODE'; payload: string }
  | { type: 'SET_DRAWING_MODE'; payload: DrawingMode }
  | { type: 'TRACK_ADDITION'; payload: { episode: string; layer: BosLayer } }
  | { type: 'IMPORT_DATA'; payload: BosFeatureCollection }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: BosState = {
  data: createEmptyFeatureCollection(),
  visibleLayers: {
    geography: true,
    institutions: true,
    flows: true,
    borders: true,
  },
  currentEpisode: 'S01E01',
  drawingMode: 'none',
  sessionAdditions: {},
  isLoading: true,
  error: null,
};

function bosReducer(state: BosState, action: BosAction): BosState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        isLoading: false,
      };

    case 'ADD_FEATURE':
      return {
        ...state,
        data: {
          ...state.data,
          features: [...state.data.features, action.payload],
        },
        drawingMode: 'none',
      };

    case 'TOGGLE_LAYER':
      return {
        ...state,
        visibleLayers: {
          ...state.visibleLayers,
          [action.payload]: !state.visibleLayers[action.payload],
        },
      };

    case 'SET_CURRENT_EPISODE':
      return {
        ...state,
        currentEpisode: action.payload,
      };

    case 'SET_DRAWING_MODE':
      return {
        ...state,
        drawingMode: action.payload,
      };

    case 'TRACK_ADDITION': {
      const { episode, layer } = action.payload;
      const currentCount = state.sessionAdditions[episode]?.[layer] ?? 0;
      return {
        ...state,
        sessionAdditions: {
          ...state.sessionAdditions,
          [episode]: {
            ...state.sessionAdditions[episode],
            [layer]: currentCount + 1,
          },
        },
      };
    }

    case 'IMPORT_DATA':
      return {
        ...state,
        data: action.payload,
        sessionAdditions: {},
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
}

interface BosContextValue {
  state: BosState;
  dispatch: React.Dispatch<BosAction>;
  addFeature: (feature: BosFeature) => void;
  toggleLayer: (layer: BosLayer) => void;
  setCurrentEpisode: (episode: string) => void;
  setDrawingMode: (mode: DrawingMode) => void;
  trackAddition: (episode: string, layer: BosLayer) => void;
  importData: (data: BosFeatureCollection) => void;
  exportData: () => void;
}

const BosContext = createContext<BosContextValue | null>(null);

interface BosProviderProps {
  children: ReactNode;
}

export function BosProvider({ children }: BosProviderProps) {
  const [state, dispatch] = useReducer(bosReducer, initialState);

  useEffect(() => {
    async function loadSeedData() {
      try {
        const response = await fetch('/data/bos.geojson');
        if (!response.ok) {
          throw new Error(`Failed to load seed data: ${response.status}`);
        }
        const data = await response.json();

        if (!validateBosFeatureCollection(data)) {
          throw new Error('Invalid seed data format');
        }

        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'SET_ERROR', payload: message });
      }
    }

    loadSeedData();
  }, []);

  const addFeature = (feature: BosFeature) => {
    dispatch({ type: 'ADD_FEATURE', payload: feature });
  };

  const toggleLayer = (layer: BosLayer) => {
    dispatch({ type: 'TOGGLE_LAYER', payload: layer });
  };

  const setCurrentEpisode = (episode: string) => {
    dispatch({ type: 'SET_CURRENT_EPISODE', payload: episode });
  };

  const setDrawingMode = (mode: DrawingMode) => {
    dispatch({ type: 'SET_DRAWING_MODE', payload: mode });
  };

  const trackAddition = (episode: string, layer: BosLayer) => {
    dispatch({ type: 'TRACK_ADDITION', payload: { episode, layer } });
  };

  const importData = (data: BosFeatureCollection) => {
    dispatch({ type: 'IMPORT_DATA', payload: data });
  };

  const exportData = () => {
    const json = JSON.stringify(state.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bos.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const value: BosContextValue = {
    state,
    dispatch,
    addFeature,
    toggleLayer,
    setCurrentEpisode,
    setDrawingMode,
    trackAddition,
    importData,
    exportData,
  };

  return <BosContext.Provider value={value}>{children}</BosContext.Provider>;
}

export function useBosData(): BosContextValue {
  const context = useContext(BosContext);
  if (!context) {
    throw new Error('useBosData must be used within a BosProvider');
  }
  return context;
}
