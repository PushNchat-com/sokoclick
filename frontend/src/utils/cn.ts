import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and then merges Tailwind classes using tailwind-merge.
 * This prevents class conflicts and provides a clean way to conditionally apply classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
