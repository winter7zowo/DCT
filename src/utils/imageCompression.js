const MIME_TYPE = 'image/jpeg';

export function normalizeQuality(quality) {
  const numericQuality = Number(quality);
  if (Number.isNaN(numericQuality)) {
    return 0.75;
  }

  return Math.min(1, Math.max(0.01, numericQuality / 100));
}

export function formatBytes(bytes) {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getSavingsPercent(originalSize, compressedSize) {
  if (!originalSize || !compressedSize) {
    return 0;
  }

  return Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
}

export function getDownloadName(fileName, quality) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'image';
  return `${baseName}-q${quality}.jpg`;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };

    image.src = url;
  });
}

async function loadDrawableImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      return loadImageElement(file);
    }
  }

  return loadImageElement(file);
}

export async function compressImageToJpeg(file, quality) {
  const drawable = await loadDrawableImage(file);
  const width = drawable.width || drawable.naturalWidth;
  const height = drawable.height || drawable.naturalHeight;

  if (!width || !height) {
    throw new Error('图片尺寸无效');
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  canvas.width = width;
  canvas.height = height;
  if (!context) {
    throw new Error('当前浏览器不支持 Canvas 压缩');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(drawable, 0, 0, width, height);

  if ('close' in drawable) {
    drawable.close();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('JPEG 压缩失败'));
          return;
        }

        resolve(blob);
      },
      MIME_TYPE,
      normalizeQuality(quality),
    );
  });
}
