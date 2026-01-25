import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlideNavigation } from './useSlideNavigation';

describe('useSlideNavigation', () => {
  const mockOnExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with currentSlide at 0', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isFirstSlide).toBe(true);
    expect(result.current.isLastSlide).toBe(false);
  });

  it('nextSlide increments currentSlide', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    act(() => {
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(1);
    expect(result.current.isFirstSlide).toBe(false);
  });

  it('prevSlide decrements currentSlide', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    act(() => {
      result.current.nextSlide();
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(2);

    act(() => {
      result.current.prevSlide();
    });

    expect(result.current.currentSlide).toBe(1);
  });

  it('goToSlide sets currentSlide to specific index', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    act(() => {
      result.current.goToSlide(5);
    });

    expect(result.current.currentSlide).toBe(5);
  });

  it('does not go past the last slide', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    act(() => {
      result.current.goToSlide(7);
    });

    expect(result.current.currentSlide).toBe(7);
    expect(result.current.isLastSlide).toBe(true);

    act(() => {
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(7); // Still at 7
  });

  it('does not go before the first slide', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    expect(result.current.currentSlide).toBe(0);

    act(() => {
      result.current.prevSlide();
    });

    expect(result.current.currentSlide).toBe(0); // Still at 0
  });

  it('goToSlide ignores invalid indices', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
    );

    act(() => {
      result.current.goToSlide(-1);
    });
    expect(result.current.currentSlide).toBe(0);

    act(() => {
      result.current.goToSlide(10);
    });
    expect(result.current.currentSlide).toBe(0);
  });

  describe('keyboard navigation', () => {
    it('responds to ArrowRight key', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });

      expect(result.current.currentSlide).toBe(1);
    });

    it('responds to ArrowLeft key', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        result.current.goToSlide(3);
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });

      expect(result.current.currentSlide).toBe(2);
    });

    it('responds to Space key', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });

      expect(result.current.currentSlide).toBe(1);
    });

    it('responds to Home key', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        result.current.goToSlide(5);
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
      });

      expect(result.current.currentSlide).toBe(0);
    });

    it('responds to End key', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
      });

      expect(result.current.currentSlide).toBe(7);
    });

    it('responds to Escape key and calls onExit', () => {
      renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(mockOnExit).toHaveBeenCalledTimes(1);
    });

    it('responds to number keys for direct slide access', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 8, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' }));
      });

      expect(result.current.currentSlide).toBe(3); // 4 - 1 = 3 (0-indexed)
    });

    it('ignores number keys beyond total slides', () => {
      const { result } = renderHook(() =>
        useSlideNavigation({ totalSlides: 5, onExit: mockOnExit })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '9' }));
      });

      expect(result.current.currentSlide).toBe(0); // Should remain at 0
    });
  });
});
