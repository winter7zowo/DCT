import { useCallback, useEffect, useMemo, useState } from 'react';
import { runManualDctCompression } from '../utils/manualDctCompression.js';

export function useManualDctCompressor() {
  const [imageFile, setImageFileState] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState('');
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
    setResult(null);
    setImageFileState(file);
  }, []);

  const clearImage = useCallback(() => {
    setError('');
    setImageFileState(null);
    setResult(null);
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
      setResult(null);
      setIsCompressing(false);
      return undefined;
    }

    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCompressing(true);
        setError('');
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const nextResult = await runManualDctCompression(imageFile);

        if (isCurrent) {
          setResult(nextResult);
        }
      } catch (compressionError) {
        if (isCurrent) {
          setError(compressionError.message || 'DCT 压缩失败');
          setResult(null);
        }
      } finally {
        if (isCurrent) {
          setIsCompressing(false);
        }
      }
    }, 80);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!result?.blob) {
      setResultPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(result.blob);
    setResultPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [result]);

  const downloadInfo = useMemo(() => {
    if (!result?.blob || !resultPreviewUrl) {
      return null;
    }

    return {
      href: resultPreviewUrl,
      name: result.downloadName,
      size: result.blob.size,
    };
  }, [result, resultPreviewUrl]);

  return {
    imageFile,
    sourcePreviewUrl,
    result,
    resultPreviewUrl,
    isCompressing,
    error,
    downloadInfo,
    setImageFile,
    clearImage,
  };
}
