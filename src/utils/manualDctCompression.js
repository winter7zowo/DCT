const BLOCK_SIZE = 8;
const MAX_DCT_EDGE = 1024;
export const MANUAL_DCT_QUALITY = 50;

const LUMA_QUANTIZATION_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61,
  12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77,
  24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

const CHROMA_QUANTIZATION_TABLE = [
  17, 18, 24, 47, 99, 99, 99, 99,
  18, 21, 26, 66, 99, 99, 99, 99,
  24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
];

const DCT_MATRIX = Array.from({ length: BLOCK_SIZE }, (_, frequency) => {
  const scale = frequency === 0 ? Math.SQRT1_2 : 1;

  return Array.from(
    { length: BLOCK_SIZE },
    (_, sample) =>
      0.5 *
      scale *
      Math.cos(((2 * sample + 1) * frequency * Math.PI) / 16),
  );
});

function clampByte(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function rgbToYcbcr(red, green, blue) {
  return [
    0.299 * red + 0.587 * green + 0.114 * blue,
    -0.168736 * red - 0.331264 * green + 0.5 * blue + 128,
    0.5 * red - 0.418688 * green - 0.081312 * blue + 128,
  ];
}

function ycbcrToRgb(y, cb, cr) {
  const shiftedCb = cb - 128;
  const shiftedCr = cr - 128;

  return [
    clampByte(y + 1.402 * shiftedCr),
    clampByte(y - 0.344136 * shiftedCb - 0.714136 * shiftedCr),
    clampByte(y + 1.772 * shiftedCb),
  ];
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

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('导出图片失败'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

function getDctDownloadName(fileName) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'image';
  return `${baseName}-manual-dct-q50.png`;
}

function forwardDct(input, output, temp) {
  for (let y = 0; y < BLOCK_SIZE; y += 1) {
    for (let u = 0; u < BLOCK_SIZE; u += 1) {
      let sum = 0;

      for (let x = 0; x < BLOCK_SIZE; x += 1) {
        sum += DCT_MATRIX[u][x] * input[y * BLOCK_SIZE + x];
      }

      temp[y * BLOCK_SIZE + u] = sum;
    }
  }

  for (let v = 0; v < BLOCK_SIZE; v += 1) {
    for (let u = 0; u < BLOCK_SIZE; u += 1) {
      let sum = 0;

      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        sum += DCT_MATRIX[v][y] * temp[y * BLOCK_SIZE + u];
      }

      output[v * BLOCK_SIZE + u] = sum;
    }
  }
}

function inverseDct(input, output, temp) {
  for (let y = 0; y < BLOCK_SIZE; y += 1) {
    for (let u = 0; u < BLOCK_SIZE; u += 1) {
      let sum = 0;

      for (let v = 0; v < BLOCK_SIZE; v += 1) {
        sum += DCT_MATRIX[v][y] * input[v * BLOCK_SIZE + u];
      }

      temp[y * BLOCK_SIZE + u] = sum;
    }
  }

  for (let y = 0; y < BLOCK_SIZE; y += 1) {
    for (let x = 0; x < BLOCK_SIZE; x += 1) {
      let sum = 0;

      for (let u = 0; u < BLOCK_SIZE; u += 1) {
        sum += DCT_MATRIX[u][x] * temp[y * BLOCK_SIZE + u];
      }

      output[y * BLOCK_SIZE + x] = sum;
    }
  }
}

function compressBlock(channel, quantizationTable, work) {
  for (let index = 0; index < 64; index += 1) {
    work.centered[index] = channel[index] - 128;
  }

  forwardDct(work.centered, work.coefficients, work.temp);

  let keptCoefficients = 0;
  for (let index = 0; index < 64; index += 1) {
    const quantized = Math.round(work.coefficients[index] / quantizationTable[index]);
    work.dequantized[index] = quantized * quantizationTable[index];

    if (quantized !== 0) {
      keptCoefficients += 1;
    }
  }

  inverseDct(work.dequantized, work.reconstructed, work.temp);

  for (let index = 0; index < 64; index += 1) {
    channel[index] = work.reconstructed[index] + 128;
  }

  return keptCoefficients;
}

function createWorkBuffers() {
  return {
    centered: new Float32Array(64),
    coefficients: new Float32Array(64),
    dequantized: new Float32Array(64),
    reconstructed: new Float32Array(64),
    temp: new Float32Array(64),
  };
}

function createSourceCanvas(drawable) {
  const sourceWidth = drawable.width || drawable.naturalWidth;
  const sourceHeight = drawable.height || drawable.naturalHeight;
  const scale = Math.min(1, MAX_DCT_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    throw new Error('当前浏览器不支持 Canvas 处理');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(drawable, 0, 0, width, height);

  return { canvas, context, width, height, scale };
}

export async function runManualDctCompression(file) {
  const startedAt = performance.now();
  const drawable = await loadDrawableImage(file);
  const { canvas, context, width, height, scale } = createSourceCanvas(drawable);

  if ('close' in drawable) {
    drawable.close();
  }

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const yChannel = new Float32Array(64);
  const cbChannel = new Float32Array(64);
  const crChannel = new Float32Array(64);
  const work = createWorkBuffers();

  let blockCount = 0;
  let keptCoefficients = 0;

  for (let blockY = 0; blockY < height; blockY += BLOCK_SIZE) {
    for (let blockX = 0; blockX < width; blockX += BLOCK_SIZE) {
      blockCount += 1;

      for (let localY = 0; localY < BLOCK_SIZE; localY += 1) {
        for (let localX = 0; localX < BLOCK_SIZE; localX += 1) {
          const sampleX = Math.min(width - 1, blockX + localX);
          const sampleY = Math.min(height - 1, blockY + localY);
          const sourceIndex = (sampleY * width + sampleX) * 4;
          const channelIndex = localY * BLOCK_SIZE + localX;
          const [y, cb, cr] = rgbToYcbcr(
            data[sourceIndex],
            data[sourceIndex + 1],
            data[sourceIndex + 2],
          );

          yChannel[channelIndex] = y;
          cbChannel[channelIndex] = cb;
          crChannel[channelIndex] = cr;
        }
      }

      keptCoefficients += compressBlock(yChannel, LUMA_QUANTIZATION_TABLE, work);
      keptCoefficients += compressBlock(cbChannel, CHROMA_QUANTIZATION_TABLE, work);
      keptCoefficients += compressBlock(crChannel, CHROMA_QUANTIZATION_TABLE, work);

      for (let localY = 0; localY < BLOCK_SIZE; localY += 1) {
        for (let localX = 0; localX < BLOCK_SIZE; localX += 1) {
          const outputX = blockX + localX;
          const outputY = blockY + localY;

          if (outputX >= width || outputY >= height) {
            continue;
          }

          const channelIndex = localY * BLOCK_SIZE + localX;
          const outputIndex = (outputY * width + outputX) * 4;
          const [red, green, blue] = ycbcrToRgb(
            yChannel[channelIndex],
            cbChannel[channelIndex],
            crChannel[channelIndex],
          );

          output[outputIndex] = red;
          output[outputIndex + 1] = green;
          output[outputIndex + 2] = blue;
          output[outputIndex + 3] = 255;
        }
      }
    }
  }

  imageData.data.set(output);
  context.putImageData(imageData, 0, 0);

  const blob = await canvasToBlob(canvas);
  const totalCoefficients = blockCount * 64 * 3;

  return {
    blob,
    downloadName: getDctDownloadName(file.name),
    stats: {
      width,
      height,
      scale,
      blockCount,
      keptCoefficients,
      totalCoefficients,
      zeroedPercent: Math.round((1 - keptCoefficients / totalCoefficients) * 100),
      elapsedMs: Math.round(performance.now() - startedAt),
    },
  };
}
