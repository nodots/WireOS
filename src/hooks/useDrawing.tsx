/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { DrawingMode } from '../types/bos';

type GeometryCoords = [number, number][] | [number, number];
type GeometryCallback = (coords: GeometryCoords) => void;

interface DrawingContextValue {
  drawingMode: DrawingMode;
  startDrawing: (mode: DrawingMode, onComplete: GeometryCallback) => void;
  cancelDrawing: () => void;
  completeDrawing: (coords: GeometryCoords) => void;
}

const DrawingContext = createContext<DrawingContextValue | null>(null);

interface DrawingProviderProps {
  children: ReactNode;
}

export function DrawingProvider({ children }: DrawingProviderProps) {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [onCompleteCallback, setOnCompleteCallback] =
    useState<GeometryCallback | null>(null);

  const startDrawing = useCallback(
    (mode: DrawingMode, onComplete: GeometryCallback) => {
      setDrawingMode(mode);
      // Wrap in function to avoid React treating the callback as a state updater
      setOnCompleteCallback(() => onComplete);
    },
    []
  );

  const cancelDrawing = useCallback(() => {
    setDrawingMode('none');
    setOnCompleteCallback(null);
  }, []);

  const completeDrawing = useCallback(
    (coords: GeometryCoords) => {
      if (onCompleteCallback) {
        onCompleteCallback(coords);
      }
      setDrawingMode('none');
      setOnCompleteCallback(null);
    },
    [onCompleteCallback]
  );

  const value: DrawingContextValue = {
    drawingMode,
    startDrawing,
    cancelDrawing,
    completeDrawing,
  };

  return (
    <DrawingContext.Provider value={value}>{children}</DrawingContext.Provider>
  );
}

export function useDrawing(): DrawingContextValue {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error('useDrawing must be used within a DrawingProvider');
  }
  return context;
}
