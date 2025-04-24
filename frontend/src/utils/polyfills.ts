// Type augmentations for window object
interface Window {
  IntersectionObserver?: typeof IntersectionObserver;
  ResizeObserver?: typeof ResizeObserver;
}

// IntersectionObserver polyfill
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  import('intersection-observer').then(() => {
    console.log('IntersectionObserver polyfill loaded');
  });
}

// ResizeObserver polyfill
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  import('resize-observer-polyfill').then(() => {
    console.log('ResizeObserver polyfill loaded');
  });
}

// closest polyfill with proper typing
if (typeof window !== 'undefined' && !Element.prototype.closest) {
  Element.prototype.closest = function(this: Element, selector: string): Element | null {
    let el: Element | null = this;
    
    do {
      if (el && el.matches(selector)) {
        return el;
      }
      el = el?.parentElement || null;
    } while (el !== null);
    
    return null;
  };
}

// Note: We no longer need the fetch polyfill as we're using Supabase's built-in fetch implementation

export {}; 