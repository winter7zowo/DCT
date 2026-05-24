import DctControls from '../components/DctControls.jsx';
import PageNav from '../components/PageNav.jsx';
import PreviewPanel from '../components/PreviewPanel.jsx';
import { useManualDctCompressor } from '../hooks/useManualDctCompressor.js';

export default function ManualDctPage() {
  const {
    imageFile,
    sourcePreviewUrl,
    result,
    resultPreviewUrl,
    isCompressing,
    error,
    downloadInfo,
    setImageFile,
    clearImage,
  } = useManualDctCompressor();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">DCT JPEG Studio</p>
          <h1>手写 DCT 压缩</h1>
        </div>
        <div className="header-actions">
          <PageNav activePage="dct" />
          <div className="header-status">
            <span>手写核心</span>
            <strong>Q50</strong>
          </div>
        </div>
      </header>

      <div className="workspace">
        <section className="preview-grid" aria-label="DCT 图片预览">
          <PreviewPanel
            title="原图"
            badge="Source"
            imageUrl={sourcePreviewUrl}
            size={imageFile?.size}
          />
          <PreviewPanel
            title="DCT 重建"
            badge="8x8 DCT"
            imageUrl={resultPreviewUrl}
            size={result?.blob.size}
            isLoading={isCompressing}
          />
        </section>

        <DctControls
          imageFile={imageFile}
          result={result}
          downloadInfo={downloadInfo}
          isCompressing={isCompressing}
          error={error}
          onFileSelect={setImageFile}
          onClear={clearImage}
        />
      </div>
    </main>
  );
}
