import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '../store/LanguageContext';

interface UndoOptions<T> {
  maxHistorySize?: number;
  undoText?: {
    undo: { en: string; fr: string };
    noUndoAvailable: { en: string; fr: string };
  };
}

/**
 * Custom hook for undo functionality
 * @param initialState The initial state
 * @param options Hook options
 * @returns Undo state and functions
 */
export default function useUndo<T>(
  initialState: T,
  options: UndoOptions<T> = {}
) {
  const { t } = useLanguage();
  const {
    maxHistorySize = 10,
    undoText = {
      undo: { en: 'Undo', fr: 'Annuler' },
      noUndoAvailable: { en: 'No actions to undo', fr: 'Aucune action à annuler' }
    }
  } = options;
  
  // Current state
  const [state, setState] = useState<T>(initialState);
  
  // History stack
  const history = useRef<T[]>([initialState]);
  
  // Current position in history
  const position = useRef<number>(0);
  
  // Keep track of whether we're in the middle of an undo
  const isUndoing = useRef<boolean>(false);
  
  // Text content
  const text = {
    undo: isUndoing.current 
      ? { en: 'Undoing...', fr: 'Annulation...' }
      : canUndo() 
        ? undoText.undo 
        : undoText.noUndoAvailable
  };
  
  /**
   * Check if undo is available
   */
  function canUndo(): boolean {
    return position.current > 0;
  }
  
  /**
   * Set a new state and add it to history
   */
  const set = useCallback((newState: T) => {
    if (isUndoing.current) {
      setState(newState);
      isUndoing.current = false;
      return;
    }
    
    setState(newState);
    
    // Add to history and trim if needed
    const newPosition = position.current + 1;
    const newHistory = [
      ...history.current.slice(0, newPosition),
      newState
    ].slice(-maxHistorySize);
    
    history.current = newHistory;
    position.current = newHistory.length - 1;
  }, [maxHistorySize]);
  
  /**
   * Undo to the previous state
   */
  const undo = useCallback(() => {
    if (position.current <= 0) return state;
    
    isUndoing.current = true;
    const newPosition = position.current - 1;
    position.current = newPosition;
    
    const previousState = history.current[newPosition];
    setState(previousState);
    
    return previousState;
  }, [state]);
  
  /**
   * Reset the history
   */
  const resetHistory = useCallback(() => {
    history.current = [state];
    position.current = 0;
  }, [state]);
  
  /**
   * Clean up resources
   */
  const cleanup = useCallback(() => {
    history.current = [initialState];
    position.current = 0;
    isUndoing.current = false;
  }, [initialState]);
  
  return {
    state,
    set,
    undo,
    canUndo: canUndo(),
    resetHistory,
    cleanup,
    text
  };
} 