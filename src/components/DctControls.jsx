import ImageDropZone from './ImageDropZone.jsx';
import { formatBytes } from '../utils/imageCompression.js';
import { MANUAL_DCT_QUALITY } from '../utils/manualDctCompression.js';

export default function DctControls({
  imageFile,
  result,
  downloadInfo,
  isCompressing,
  error,
  onFileSelect,
  onClear,
}) {
  const originalSize = imageFile ? formatBytes(imageFile.size) : '0 B';
  const outputSize = downloadInfo ? formatBytes(downloadInfo.size) : '0 B';
  const zeroedPercent = result ? `${result.stats.zeroedPercent}%` : '0%';
  const dimensions = result ? `${result.stats.width} x ${result.stats.height}` : '-';

  return (
    <aside className="control-panel">
      <ImageDropZone
        imageFile={imageFile}
        onFileSelect={onFileSelect}
        onClear={onClear}
      />

      <section className="quality-control" aria-label="DCT 质量">
        <div className="section-heading">
          <p>固定量化</p>
          <strong>Q{MANUAL_DCT_QUALITY}</strong>
        </div>

        <div className="fixed-quality-bar" aria-hidden="true">
          <span style={{ width: `${MANUAL_DCT_QUALITY}%` }} />
        </div>
      </section>

      <section className="metrics" aria-label="DCT 信息">
        <div className="metric-row">
          <span>原始大小</span>
          <strong>{originalSize}</strong>
        </div>
        <div className="metric-row">
          <span>重建图</span>
          <strong>{outputSize}</strong>
        </div>
        <div className="metric-row">
          <span>置零系数</span>
          <strong>{zeroedPercent}</strong>
        </div>
        <div className="metric-row">
          <span>处理尺寸</span>
          <strong>{dimensions}</strong>
        </div>
      </section>

      {error ? <p className="error-message">{error}</p> : null}

      <a
        className={`button button--download${
          !downloadInfo || isCompressing ? ' is-disabled' : ''
        }`}
        href={downloadInfo?.href}
        download={downloadInfo?.name}
        aria-disabled={!downloadInfo || isCompressing}
        onClick={(event) => {
          if (!downloadInfo || isCompressing) {
            event.preventDefault();
          }
        }}
      >
        {isCompressing ? 'DCT 计算中' : '下载重建图'}
      </a>
    </aside>
  );
}
