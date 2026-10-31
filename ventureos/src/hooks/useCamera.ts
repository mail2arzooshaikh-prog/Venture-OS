// useCamera.ts - Complete camera lifecycle management hook
import { useState, useRef, useCallback, useEffect } from 'react';

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  startCamera: (constraints?: MediaStreamConstraints) => Promise<void>;
  stopCamera: () => void;
  captureImage: () => CapturedImage | null;
  switchCamera: () => Promise<void>;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

const BASIC_CONSTRAINTS: MediaStreamConstraints = {
  video: true,
  audio: false,
};

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');

  const stopCamera = useCallback(() => {
    setStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => track.stop());
      }
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async (constraints?: MediaStreamConstraints): Promise<void> => {
    setError(null);
    setIsLoading(true);
    setIsActive(false);

    // Stop any existing stream first
    setStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => track.stop());
      }
      return null;
    });

    if (!navigator.mediaDevices) {
      setError('Camera access requires a secure connection. Please use HTTPS.');
      setIsLoading(false);
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera access. Try uploading a document instead.');
      setIsLoading(false);
      return;
    }

    const effectiveConstraints = constraints ?? DEFAULT_CONSTRAINTS;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(effectiveConstraints);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const onLoaded = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            video.removeEventListener('error', onError);
            resolve();
          };
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoaded);
            video.removeEventListener('error', onError);
            reject(new Error('Video element error'));
          };
          video.addEventListener('loadedmetadata', onLoaded);
          video.addEventListener('error', onError);
          // Resolve after timeout in case event already fired
          setTimeout(resolve, 2000);
        });
        await videoRef.current.play().catch(() => {
          // play() rejection is acceptable on some browsers (autoplay policy)
        });
      }

      setStream(mediaStream);
      setIsActive(true);
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setIsActive(false);

      const domError = err as DOMException;
      const name = domError?.name ?? '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setHasPermission(false);
        setError(
          'Camera access is blocked. Allow camera permission in your browser settings, or upload a document instead.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No camera was detected on this device. You can still upload a document.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('The camera may be in use by another application. Close other camera applications and try again.');
      } else if (name === 'OverconstrainedError') {
        // Retry with basic constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia(BASIC_CONSTRAINTS);
          setHasPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await new Promise<void>(resolve => {
              const video = videoRef.current!;
              video.addEventListener('loadedmetadata', () => resolve(), { once: true });
              setTimeout(resolve, 2000);
            });
            await videoRef.current.play().catch(() => {});
          }
          setStream(fallbackStream);
          setIsActive(true);
        } catch {
          setError('The camera could not be started. Try again or use document upload.');
        }
      } else if (name === 'SecurityError') {
        setError('Camera access requires a secure connection. Please use HTTPS.');
      } else {
        setError('The camera could not be started. Try again or use document upload.');
      }
    }
  }, []);

  const captureImage = useCallback((): CapturedImage | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Check if canvas is not blank by sampling center pixel
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const pixelData = ctx.getImageData(centerX, centerY, 1, 1).data;
    const isBlank = pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0 && pixelData[3] === 0;
    if (isBlank) {
      return null;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Convert dataUrl to blob
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    return { blob, dataUrl };
  }, []);

  const switchCamera = useCallback(async (): Promise<void> => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newFacingMode);
    await startCamera({
      video: {
        facingMode: newFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  }, [currentFacingMode, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isActive,
    isLoading,
    error,
    hasPermission,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  };
}

export default useCamera;
