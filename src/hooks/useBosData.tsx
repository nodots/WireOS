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
  SessionAdditions,
} from '../types/bos';
import {
  createEmptyFeatureCollection,
  validateBosFeatureCollection,
} from '../utils/geojson';

const STORAGE_KEY = 'wireos-bos-data';

interface BosState {
  data: BosFeatureCollection;
  visibleLayers: Record<BosLayer, boolean>;
  currentEpisode: string;
  sessionAdditions: SessionAdditions;
  isLoading: boolean;
  error: string | null;
  editingFeature: BosFeature | null;
}

type BosAction =
  | { type: 'SET_DATA'; payload: BosFeatureCollection }
  | { type: 'ADD_FEATURE'; payload: BosFeature }
  | { type: 'UPDATE_FEATURE'; payload: BosFeature }
  | { type: 'DELETE_FEATURE'; payload: string }
  | { type: 'TOGGLE_LAYER'; payload: BosLayer }
  | { type: 'SET_CURRENT_EPISODE'; payload: string }
  | { type: 'TRACK_ADDITION'; payload: { episode: string; layer: BosLayer } }
  | { type: 'IMPORT_DATA'; payload: BosFeatureCollection }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EDITING_FEATURE'; payload: BosFeature | null };

const initialState: BosState = {
  data: createEmptyFeatureCollection(),
  visibleLayers: {
    geography: true,
    institutions: true,
    flows: true,
    borders: true,
  },
  currentEpisode: 'S01E01',
  sessionAdditions: {},
  isLoading: true,
  error: null,
  editingFeature: null,
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
      };

    case 'UPDATE_FEATURE':
      return {
        ...state,
        data: {
          ...state.data,
          features: state.data.features.map((f) =>
            f.properties.id === action.payload.properties.id ? action.payload : f
          ),
        },
        editingFeature: null,
      };

    case 'DELETE_FEATURE':
      return {
        ...state,
        data: {
          ...state.data,
          features: state.data.features.filter(
            (f) => f.properties.id !== action.payload
          ),
        },
      };

    case 'SET_EDITING_FEATURE':
      return {
        ...state,
        editingFeature: action.payload,
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
  updateFeature: (feature: BosFeature) => void;
  deleteFeature: (id: string) => void;
  setEditingFeature: (feature: BosFeature | null) => void;
  toggleLayer: (layer: BosLayer) => void;
  setCurrentEpisode: (episode: string) => void;
  trackAddition: (episode: string, layer: BosLayer) => void;
  importData: (data: BosFeatureCollection) => void;
  exportData: () => void;
  resetData: () => void;
}

const BosContext = createContext<BosContextValue | null>(null);

interface BosProviderProps {
  children: ReactNode;
}

export function BosProvider({ children }: BosProviderProps) {
  const [state, dispatch] = useReducer(bosReducer, initialState);

  // Load data: try localStorage first, fall back to seed data
  useEffect(() => {
    async function loadData() {
      // Try localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (validateBosFeatureCollection(data)) {
            dispatch({ type: 'SET_DATA', payload: data });
            return;
          }
        } catch {
          // Invalid localStorage data, fall through to seed data
        }
      }

      // Fall back to seed data
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

    loadData();
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!state.isLoading && state.data.features.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    }
  }, [state.data, state.isLoading]);

  const addFeature = (feature: BosFeature) => {
    dispatch({ type: 'ADD_FEATURE', payload: feature });
  };

  const updateFeature = (feature: BosFeature) => {
    dispatch({ type: 'UPDATE_FEATURE', payload: feature });
  };

  const deleteFeature = (id: string) => {
    dispatch({ type: 'DELETE_FEATURE', payload: id });
  };

  const setEditingFeature = (feature: BosFeature | null) => {
    dispatch({ type: 'SET_EDITING_FEATURE', payload: feature });
  };

  const toggleLayer = (layer: BosLayer) => {
    dispatch({ type: 'TOGGLE_LAYER', payload: layer });
  };

  const setCurrentEpisode = (episode: string) => {
    dispatch({ type: 'SET_CURRENT_EPISODE', payload: episode });
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

  const resetData = async () => {
    localStorage.removeItem(STORAGE_KEY);
    try {
      const response = await fetch('/data/bos.geojson');
      if (response.ok) {
        const data = await response.json();
        if (validateBosFeatureCollection(data)) {
          dispatch({ type: 'SET_DATA', payload: data });
        }
      }
    } catch {
      // Ignore errors, just clear to empty
      dispatch({ type: 'SET_DATA', payload: createEmptyFeatureCollection() });
    }
  };

  const value: BosContextValue = {
    state,
    dispatch,
    addFeature,
    updateFeature,
    deleteFeature,
    setEditingFeature,
    toggleLayer,
    setCurrentEpisode,
    trackAddition,
    importData,
    exportData,
    resetData,
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
