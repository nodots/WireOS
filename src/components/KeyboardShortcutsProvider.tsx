import { type ReactNode } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  onOpenFeatureForm?: () => void;
}

export function KeyboardShortcutsProvider({
  children,
  onOpenFeatureForm,
}: KeyboardShortcutsProviderProps) {
  useKeyboardShortcuts({ onOpenFeatureForm });
  return <>{children}</>;
}
