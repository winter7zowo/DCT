import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  compressImageToJpeg,
  getDownloadName,
  getSavingsPercent,
} from '../utils/imageCompression.js';

export function useImageCompressor() {
  const [imageFile, setImageFileState] = useState(null);
  const [quality, setQuality] = useState(76);
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
    setImageFileState(file);
  }, []);

  const clearImage = useCallback(() => {
    setError('');
    setImageFileState(null);
    setCompressedBlob(null);
  }, []);

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
    if (!imageFile) {
      setCompressedBlob(null);
      setIsCompressing(false);
      return undefined;
    }

    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCompressing(true);
        setError('');
        const blob = await compressImageToJpeg(imageFile, quality);

        if (isCurrent) {
          setCompressedBlob(blob);
        }
      } catch (compressionError) {
        if (isCurrent) {
          setError(compressionError.message || '压缩失败');
          setCompressedBlob(null);
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
  }, [imageFile, quality]);

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
    if (!imageFile || !compressedBlob) {
      return null;
    }

    return {
      href: compressedPreviewUrl,
      name: getDownloadName(imageFile.name, quality),
      size: compressedBlob.size,
      savings: getSavingsPercent(imageFile.size, compressedBlob.size),
    };
  }, [compressedBlob, compressedPreviewUrl, imageFile, quality]);

  return {
    imageFile,
    quality,
    sourcePreviewUrl,
    compressedBlob,
    compressedPreviewUrl,
    isCompressing,
    error,
    downloadInfo,
    setImageFile,
    setQuality,
    clearImage,
  };
}
