import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, X, RotateCcw, Check } from 'lucide-react';
import { compressImageWithQuality } from '../utils/imageCompression';

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

    // Auto-compress with balanced preset (0.8 quality, 1920px max)
    setIsCompressing(true);
    try {
      const result = await compressImageWithQuality(originalPhotoDataUrl, 0.8, 1920);
      setCapturedPhoto(result.dataUrl);
    } catch (err) {
      console.error('Compression error:', err);
      // Fallback to original if compression fails
      setCapturedPhoto(originalPhotoDataUrl);
    } finally {
      setIsCompressing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopCamera();
      onClose();
    }
  };

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
          <img
            src={capturedPhoto}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Compressing overlay */}
        {isCompressing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-lg">Compressing...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-neutral-900 flex items-center justify-center gap-6">
        {!capturedPhoto ? (
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-neutral-700 hover:border-primary-500 transition-colors flex items-center justify-center"
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
