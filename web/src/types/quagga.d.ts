/**
 * Quagga Barcode Scanner Type Definitions
 * Library: quagga (barcode scanning)
 */

declare module 'quagga' {
  /**
   * Configuration for Quagga barcode scanner
   */
  export interface QuaggaConfig {
    inputStream: {
      name?: string;
      type: string;
      target?: HTMLElement | string;
      constraints?: MediaStreamConstraints;
    };
    decoder: {
      readers: string[];
    };
    locate?: boolean;
  }

  /**
   * Result from barcode detection
   */
  export interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
  }

  /**
   * Initialize Quagga with configuration
   */
  export function init(
    config: QuaggaConfig,
    callback?: (err?: any) => void
  ): void;

  /**
   * Start barcode detection
   */
  export function start(): void;

  /**
   * Stop barcode detection
   */
  export function stop(): void;

  /**
   * Register callback for barcode detection
   */
  export function onDetected(
    callback: (result: QuaggaResult) => void
  ): void;

  /**
   * Unregister callback for barcode detection
   */
  export function offDetected(
    callback: (result: QuaggaResult) => void
  ): void;
}
