// closest polyfill for older browsers
if (!Element.prototype.closest) {
  Element.prototype.closest = function (s: string): Element | null {
    let el: Element | null = this;
    if (!document.documentElement.contains(el)) {
      return null;
    }
    do {
      if (el.matches(s)) return el;
      el = el.parentElement;
    } while (el !== null);
    return null;
  };
}

// Modern browsers have these APIs built-in, no need for polyfills
if (!("IntersectionObserver" in window)) {
  console.warn("IntersectionObserver not supported");
}

if (!("ResizeObserver" in window)) {
  console.warn("ResizeObserver not supported");
}

if (!("fetch" in window)) {
  console.warn("Fetch API not supported");
}
