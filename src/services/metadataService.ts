import exifr from 'exifr';
import { MediaMetadata } from '../types';

/**
 * Extracts authentic metadata from files using browser APIs & EXIF parser.
 * Strict forensic rule: Never fabricates metadata if absent.
 */
export async function extractFileMetadata(file: File): Promise<MediaMetadata> {
  const metadata: MediaMetadata = {};

  // 1. Image extraction
  if (file.type.startsWith('image/')) {
    try {
      // Dimensions via Image object
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          metadata.width = img.naturalWidth;
          metadata.height = img.naturalHeight;
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });

      // EXIF metadata
      const exifData = await exifr.parse(file, {
        tiff: true,
        xmp: true,
        icc: true,
        jfif: true,
        gps: true,
      });

      if (exifData) {
        if (exifData.Make) metadata.cameraMake = String(exifData.Make);
        if (exifData.Model) metadata.cameraModel = String(exifData.Model);
        if (exifData.Software) metadata.software = String(exifData.Software);
        if (exifData.DateTimeOriginal) metadata.dateTaken = new Date(exifData.DateTimeOriginal).toISOString();
        if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
          metadata.gpsLatitude = Number(exifData.latitude);
          metadata.gpsLongitude = Number(exifData.longitude);
        }
      }
    } catch (e) {
      console.warn('EXIF extraction skipped or failed:', e);
    }
  }

  // 2. Video extraction
  if (file.type.startsWith('video/')) {
    try {
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          metadata.width = video.videoWidth;
          metadata.height = video.videoHeight;
          metadata.duration = Math.round(video.duration * 10) / 10;
          metadata.codec = file.type;
          URL.revokeObjectURL(url);
          resolve();
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        video.src = url;
      });
    } catch (e) {
      console.warn('Video metadata extraction failed:', e);
    }
  }

  // 3. Audio extraction
  if (file.type.startsWith('audio/')) {
    try {
      const arrayBuffer = await file.slice(0, 1024 * 1024).arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        try {
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          metadata.duration = Math.round(audioBuffer.duration * 10) / 10;
          metadata.sampleRate = audioBuffer.sampleRate;
          metadata.audioChannels = audioBuffer.numberOfChannels;
        } catch {
          // Some formats require full file
        } finally {
          ctx.close();
        }
      }
    } catch (e) {
      console.warn('Audio metadata extraction failed:', e);
    }
  }

  return metadata;
}