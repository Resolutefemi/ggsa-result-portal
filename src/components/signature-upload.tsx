'use client';

/**
 * Reusable signature uploader.
 * - On mobile, tapping "Snap" opens the camera (capture="environment")
 * - On desktop, tapping "Upload" opens the file picker
 * - Image is resized client-side to max 800px wide and compressed to JPEG
 *   (keeps the payload small enough to store as base64 in the DB)
 * - Returns the resulting data URL via onChange
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';

interface Props {
  label: string;
  currentSignature: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

const MAX_DIM = 800; // max width/height after resize
const JPEG_QUALITY = 0.85;

export function SignatureUpload({ label, currentSignature, onChange, disabled }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const resized = await resizeImage(dataUrl, file.type);
      onChange(resized);
    } catch (e) {
      console.error(e);
      alert('Could not process that image. Please try another.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
          {processing ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : currentSignature ? (
            <img
              src={currentSignature}
              alt="Signature preview"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground text-center px-1">No signature</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
              e.target.value = '';
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || processing}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-3.5 h-3.5 mr-1" /> Snap
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || processing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1" /> Upload
          </Button>
        </div>

        {currentSignature && !disabled && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange(null)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// === Helpers ===

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImage(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Always export as JPEG to keep size small (signatures don't need transparency)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
