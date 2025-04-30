// Type definitions for requestIdleCallback API
interface Window {
  requestIdleCallback: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  
  cancelIdleCallback: (handle: number) => void;
}

interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

interface IdleRequestOptions {
  timeout?: number;
}

// Bổ sung thuộc tính fetchPriority cho HTMLImageElement
interface HTMLImageElement {
  fetchPriority: 'high' | 'low' | 'auto';
} 