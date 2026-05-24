import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  compressImageToJpeg,
  getDownloadName,
  getSavingsPercent,
} from '../utils/imageCompression.js';

const DEFAULT_QUALITY = 76;

function normalizeSliderQuality(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return DEFAULT_QUALITY;
  }

  return Math.min(100, Math.max(1, Math.round(numericValue)));
}

export function useImageCompressor() {
  const [imageFile, setImageFileState] = useState(null);
  const [quality, setQualityState] = useState(DEFAULT_QUALITY);
  const [targetQuality, setTargetQuality] = useState(DEFAULT_QUALITY);
  const [compressedQuality, setCompressedQuality] = useState(null);
  const [isAdjustingQuality, setIsAdjustingQuality] = useState(false);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState('');
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');

  const setImageFile = useCallback((file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    setError('');
    setCompressedBlob(null);
    setCompressedQuality(null);
    setImageFileState(file);
  }, []);

  const clearImage = useCallback(() => {
    setError('');
    setImageFileState(null);
    setCompressedBlob(null);
    setCompressedQuality(null);
  }, []);

  const setQuality = useCallback((nextQuality) => {
    setQualityState(normalizeSliderQuality(nextQuality));
  }, []);

  const beginQualityChange = useCallback(() => {
    setIsAdjustingQuality(true);
  }, []);

  const commitQualityChange = useCallback(
    (nextQuality = quality) => {
      const normalizedQuality = normalizeSliderQuality(nextQuality);

      setQualityState(normalizedQuality);
      setTargetQuality(normalizedQuality);
      setIsAdjustingQuality(false);
    },
    [quality],
  );

  useEffect(() => {
    if (!imageFile) {
      setSourcePreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(imageFile);
    setSourcePreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (isAdjustingQuality) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setTargetQuality(quality);
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAdjustingQuality, quality]);

  useEffect(() => {
    if (!imageFile) {
      setCompressedBlob(null);
      setCompressedQuality(null);
      setIsCompressing(false);
      return undefined;
    }

    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCompressing(true);
        setError('');
        const blob = await compressImageToJpeg(imageFile, targetQuality);

        if (isCurrent) {
          setCompressedBlob(blob);
          setCompressedQuality(targetQuality);
        }
      } catch (compressionError) {
        if (isCurrent) {
          setError(compressionError.message || '压缩失败');
          setCompressedBlob(null);
          setCompressedQuality(null);
        }
      } finally {
        if (isCurrent) {
          setIsCompressing(false);
        }
      }
    }, 120);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [imageFile, targetQuality]);

  useEffect(() => {
    if (!compressedBlob) {
      setCompressedPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(compressedBlob);
    setCompressedPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [compressedBlob]);

  const downloadInfo = useMemo(() => {
    if (!imageFile || !compressedBlob || compressedQuality !== quality) {
      return null;
    }

    return {
      href: compressedPreviewUrl,
      name: getDownloadName(imageFile.name, compressedQuality),
      size: compressedBlob.size,
      savings: getSavingsPercent(imageFile.size, compressedBlob.size),
    };
  }, [compressedBlob, compressedPreviewUrl, compressedQuality, imageFile, quality]);

  return {
    imageFile,
    quality,
    compressedQuality,
    sourcePreviewUrl,
    compressedBlob,
    compressedPreviewUrl,
    isCompressing,
    error,
    downloadInfo,
    setImageFile,
    setQuality,
    beginQualityChange,
    commitQualityChange,
    clearImage,
  };
}
