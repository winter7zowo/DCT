import CompressionControls from '../components/CompressionControls.jsx';
import PreviewPanel from '../components/PreviewPanel.jsx';
import { useImageCompressor } from '../hooks/useImageCompressor.js';

export default function CompressorPage() {
  const {
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
  } = useImageCompressor();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">DCT JPEG Studio</p>
          <h1>JPEG 压缩工作台</h1>
        </div>
        <div className="header-status">
          <span>本地处理</span>
          <strong>JPG</strong>
        </div>
      </header>

      <div className="workspace">
        <section className="preview-grid" aria-label="图片预览">
          <PreviewPanel
            title="原图"
            badge="Source"
            imageUrl={sourcePreviewUrl}
            size={imageFile?.size}
          />
          <PreviewPanel
            title="压缩后"
            badge={`Quality ${quality}`}
            imageUrl={compressedPreviewUrl}
            size={compressedBlob?.size}
            isLoading={isCompressing}
          />
        </section>

        <CompressionControls
          imageFile={imageFile}
          quality={quality}
          compressedBlob={compressedBlob}
          downloadInfo={downloadInfo}
          isCompressing={isCompressing}
          error={error}
          onQualityChange={setQuality}
          onFileSelect={setImageFile}
          onClear={clearImage}
        />
      </div>
    </main>
  );
}
