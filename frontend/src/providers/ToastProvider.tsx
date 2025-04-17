/**
 * Toast Provider compatibility layer
 * This file re-exports the ToastProvider and useToast from the components/ui/Toast
 * to maintain backward compatibility with existing imports
 */

import { ToastProvider, useToast } from '../components/ui/Toast';

export { ToastProvider, useToast };
export default ToastProvider; 