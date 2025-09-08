import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';

describe('useUndoRedo', () => {
  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    expect(result.current.value).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should set new value and enable undo', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('new value');
    });
    
    expect(result.current.value).toBe('new value');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo to previous value', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('new value');
    });
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.value).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo to next value', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('new value');
    });
    
    act(() => {
      result.current.undo();
    });
    
    act(() => {
      result.current.redo();
    });
    
    expect(result.current.value).toBe('new value');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should handle multiple undo/redo operations', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('value1');
    });
    
    act(() => {
      result.current.set('value2');
    });
    
    act(() => {
      result.current.set('value3');
    });
    
    expect(result.current.value).toBe('value3');
    expect(result.current.canUndo).toBe(true);
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.value).toBe('value2');
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.value).toBe('value1');
    
    act(() => {
      result.current.redo();
    });
    
    expect(result.current.value).toBe('value2');
  });

  it('should clear future when setting new value after undo', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('value1');
    });
    
    act(() => {
      result.current.set('value2');
    });
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.canRedo).toBe(true);
    
    act(() => {
      result.current.set('new branch');
    });
    
    expect(result.current.value).toBe('new branch');
    expect(result.current.canRedo).toBe(false);
  });

  it('should reset to new value and clear history', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    act(() => {
      result.current.set('value1');
    });
    
    act(() => {
      result.current.set('value2');
    });
    
    act(() => {
      result.current.reset('reset value');
    });
    
    expect(result.current.value).toBe('reset value');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not undo when canUndo is false', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    expect(result.current.canUndo).toBe(false);
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.value).toBe('initial');
  });

  it('should not redo when canRedo is false', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    
    expect(result.current.canRedo).toBe(false);
    
    act(() => {
      result.current.redo();
    });
    
    expect(result.current.value).toBe('initial');
  });

  it('should handle complex data types', () => {
    const initialObject = { name: 'John', age: 30 };
    const newObject = { name: 'Jane', age: 25 };
    
    const { result } = renderHook(() => useUndoRedo(initialObject));
    
    expect(result.current.value).toEqual(initialObject);
    
    act(() => {
      result.current.set(newObject);
    });
    
    expect(result.current.value).toEqual(newObject);
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.value).toEqual(initialObject);
  });
});