import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Initialize Quagga
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader'],
        },
        locate: true,
      },
      (err: any) => {
        if (err) {
          console.error('Failed to initialize scanner:', err);
          setError('Unable to access camera. Please check permissions.');
          setIsInitializing(false);
          return;
        }
        setIsInitializing(false);
        Quagga.start();
      }
    );

    // Handle barcode detection
    const handleDetected = (result: any) => {
      if (result && result.codeResult && result.codeResult.code) {
        const code = result.codeResult.code;
        console.log('Barcode detected:', code);

        // Stop scanner
        Quagga.stop();

        // Call onScan callback
        onScan(code);
      }
    };

    Quagga.onDetected(handleDetected);

    // Cleanup
    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-900">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white font-semibold">Scan Barcode</h2>
        <div className="w-10"></div>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
            <div className="bg-danger-600 text-white px-6 py-4 rounded-lg max-w-md text-center">
              <p className="font-semibold mb-2">Camera Access Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {isInitializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white text-center">
              <Camera className="w-12 h-12 mx-auto mb-3 animate-pulse" />
              <p className="text-lg">Initializing scanner...</p>
            </div>
          </div>
        )}

        {/* Scanner container */}
        <div
          ref={scannerRef}
          className="w-full h-full flex items-center justify-center"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />

        {/* Scanning guide overlay */}
        {!error && !isInitializing && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full flex items-center justify-center p-8">
              <div className="relative w-full max-w-md aspect-video">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-6 bg-neutral-900 text-center">
        <p className="text-white text-sm">
          Position the barcode within the frame to scan
        </p>
        <p className="text-neutral-400 text-xs mt-1">
          Supports EAN-13 and Code-128 formats
        </p>
      </div>
    </div>
  );
}
