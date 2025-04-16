import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPage?: number;
  loadMoreDelay?: number;
}

interface UseInfiniteScrollReturn {
  page: number;
  loadMore: () => void;
  isLoading: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

const useInfiniteScroll = ({
  threshold = 0.5,
  initialPage = 1,
  loadMoreDelay = 500,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn => {
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setIsLoading(true);
      
      // Use a timeout to prevent multiple rapid calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setPage((prevPage) => prevPage + 1);
        setIsLoading(false);
      }, loadMoreDelay);
    }
  }, [isLoading, hasMore, loadMoreDelay]);

  useEffect(() => {
    const currentElement = observerRef.current;
    
    if (currentElement && hasMore) {
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !isLoading) {
            loadMore();
          }
        },
        { threshold }
      );

      observer.current.observe(currentElement);
    }

    return () => {
      if (observer.current && currentElement) {
        observer.current.unobserve(currentElement);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadMore, isLoading, hasMore, threshold]);

  return {
    page,
    loadMore,
    isLoading,
    observerRef,
    hasMore,
    setHasMore,
  };
};

export default useInfiniteScroll; 