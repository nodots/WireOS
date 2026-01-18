import { useEffect, useCallback } from 'react';
import { useBosData } from './useBosData';
import { useDrawing } from './useDrawing';
import type { BosLayer } from '../types/bos';

const LAYER_KEYS: Record<string, BosLayer> = {
  '1': 'geography',
  '2': 'institutions',
  '3': 'flows',
  '4': 'borders',
};

interface UseKeyboardShortcutsOptions {
  onOpenFeatureForm?: () => void;
}

export function useKeyboardShortcuts({
  onOpenFeatureForm,
}: UseKeyboardShortcutsOptions = {}) {
  const { state, toggleLayer, setEditingFeature } = useBosData();
  const { drawingMode, cancelDrawing } = useDrawing();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape - cancel drawing mode or close editing
      if (e.key === 'Escape') {
        if (drawingMode !== 'none') {
          cancelDrawing();
        }
        if (state.editingFeature) {
          setEditingFeature(null);
        }
        return;
      }

      // 1-4 - Toggle layers
      if (LAYER_KEYS[e.key]) {
        e.preventDefault();
        toggleLayer(LAYER_KEYS[e.key]);
        return;
      }

      // N - Open new feature form
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onOpenFeatureForm?.();
        return;
      }
    },
    [drawingMode, state.editingFeature, toggleLayer, cancelDrawing, setEditingFeature, onOpenFeatureForm]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
