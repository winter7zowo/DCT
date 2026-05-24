import { formatBytes } from '../utils/imageCompression.js';
import ImageDropZone from './ImageDropZone.jsx';

export default function CompressionControls({
  imageFile,
  quality,
  compressedBlob,
  downloadInfo,
  isCompressing,
  error,
  onQualityChange,
  onQualityChangeStart,
  onQualityChangeCommit,
  onFileSelect,
  onClear,
}) {
  const originalSize = imageFile ? formatBytes(imageFile.size) : '0 B';
  const outputSize = compressedBlob ? formatBytes(compressedBlob.size) : '0 B';
  const savings = downloadInfo ? `${downloadInfo.savings}%` : '0%';

  return (
    <aside className="control-panel">
      <ImageDropZone
        imageFile={imageFile}
        onFileSelect={onFileSelect}
        onClear={onClear}
      />

      <section className="quality-control" aria-label="JPEG 质量">
        <div className="section-heading">
          <p>输出</p>
          <strong>{quality}%</strong>
        </div>

        <input
          className="quality-slider"
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(event) => onQualityChange(Number(event.target.value))}
          onPointerDown={onQualityChangeStart}
          onPointerUp={(event) => onQualityChangeCommit(Number(event.currentTarget.value))}
          onPointerCancel={(event) =>
            onQualityChangeCommit(Number(event.currentTarget.value))
          }
          onKeyUp={(event) => onQualityChangeCommit(Number(event.currentTarget.value))}
          onBlur={(event) => onQualityChangeCommit(Number(event.currentTarget.value))}
        />

        <div className="quality-scale" aria-hidden="true">
          <span>更小</span>
          <span>更清晰</span>
        </div>
      </section>

      <section className="metrics" aria-label="文件信息">
        <div className="metric-row">
          <span>原始大小</span>
          <strong>{originalSize}</strong>
        </div>
        <div className="metric-row">
          <span>压缩后</span>
          <strong>{outputSize}</strong>
        </div>
        <div className="metric-row">
          <span>节省</span>
          <strong>{savings}</strong>
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
        {isCompressing ? '压缩中' : '下载 JPG'}
      </a>
    </aside>
  );
}
