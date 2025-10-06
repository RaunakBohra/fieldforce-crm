import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, X, RotateCcw, Check, Sliders } from 'lucide-react';
import { compressImageWithQuality, getImageSizeKB } from '../utils/imageCompression';

interface CameraProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState('');

  // Compression controls
  const [showCompressionSettings, setShowCompressionSettings] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [maxDimension, setMaxDimension] = useState(1920);
  const [compressedPhoto, setCompressedPhoto] = useState<string | null>(null);
  const [photoMetadata, setPhotoMetadata] = useState<{
    originalSize: number;
    compressedSize: number;
    width: number;
    height: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError('');
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get original image data
    const originalPhotoDataUrl = canvas.toDataURL('image/jpeg', 1.0);
    const originalSize = getImageSizeKB(originalPhotoDataUrl);

    setCapturedPhoto(originalPhotoDataUrl);

    // Auto-compress with default settings
    setIsCompressing(true);
    try {
      const result = await compressImageWithQuality(originalPhotoDataUrl, quality, maxDimension);
      setCompressedPhoto(result.dataUrl);
      setPhotoMetadata({
        originalSize,
        compressedSize: result.sizeKB,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCompressedPhoto(null);
    setPhotoMetadata(null);
    setShowCompressionSettings(false);
  };

  const confirmPhoto = () => {
    if (compressedPhoto) {
      onCapture(compressedPhoto);
      stopCamera();
      onClose();
    }
  };

  // Re-compress when quality or dimensions change
  useEffect(() => {
    if (capturedPhoto && !isCompressing) {
      const recompress = async () => {
        setIsCompressing(true);
        try {
          const result = await compressImageWithQuality(capturedPhoto, quality, maxDimension);
          setCompressedPhoto(result.dataUrl);
          setPhotoMetadata(prev => prev ? {
            ...prev,
            compressedSize: result.sizeKB,
            width: result.width,
            height: result.height,
          } : null);
        } catch (err) {
          console.error('Recompression error:', err);
        } finally {
          setIsCompressing(false);
        }
      };
      recompress();
    }
  }, [quality, maxDimension]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedPhoto(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-900">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white font-semibold">Take Photo</h2>
        <button
          onClick={switchCamera}
          className="p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Switch camera"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-danger-600 text-white px-6 py-4 rounded-lg max-w-md text-center">
              {error}
            </div>
          </div>
        )}

        {!capturedPhoto ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="relative max-w-full max-h-full">
            <img
              src={compressedPhoto || capturedPhoto}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
            {isCompressing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-lg">Compressing...</div>
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Photo metadata overlay */}
        {capturedPhoto && photoMetadata && (
          <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-neutral-400">Original:</span>
                <span className="ml-2 font-semibold">{photoMetadata.originalSize.toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-neutral-400">Compressed:</span>
                <span className="ml-2 font-semibold text-success-400">{photoMetadata.compressedSize.toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-neutral-400">Dimensions:</span>
                <span className="ml-2 font-semibold">{photoMetadata.width}×{photoMetadata.height}</span>
              </div>
              <div>
                <span className="text-neutral-400">Savings:</span>
                <span className="ml-2 font-semibold text-success-400">
                  {((1 - photoMetadata.compressedSize / photoMetadata.originalSize) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compression Settings Panel */}
      {capturedPhoto && showCompressionSettings && (
        <div className="bg-neutral-800 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Quality</label>
              <span className="text-primary-400 text-sm">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Max Resolution</label>
              <span className="text-primary-400 text-sm">{maxDimension}px</span>
            </div>
            <input
              type="range"
              min="640"
              max="3840"
              step="160"
              value={maxDimension}
              onChange={(e) => setMaxDimension(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>640px</span>
              <span>1920px</span>
              <span>3840px</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => { setQuality(0.6); setMaxDimension(1280); }}
              className="px-3 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
            >
              Low (~50KB)
            </button>
            <button
              onClick={() => { setQuality(0.8); setMaxDimension(1920); }}
              className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-500"
            >
              Balanced (~150KB)
            </button>
            <button
              onClick={() => { setQuality(0.95); setMaxDimension(3840); }}
              className="px-3 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
            >
              High (~500KB)
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-6 bg-neutral-900 flex items-center justify-between">
        {!capturedPhoto ? (
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-neutral-700 hover:border-primary-500 transition-colors flex items-center justify-center mx-auto"
            aria-label="Capture photo"
          >
            <CameraIcon className="w-8 h-8 text-neutral-900" />
          </button>
        ) : (
          <>
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>

            <button
              onClick={() => setShowCompressionSettings(!showCompressionSettings)}
              className="px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center gap-2"
            >
              <Sliders className="w-5 h-5" />
              {showCompressionSettings ? 'Hide' : 'Adjust'}
            </button>

            <button
              onClick={confirmPhoto}
              disabled={isCompressing}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              Use Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
