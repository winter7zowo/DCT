import { formatBytes } from '../utils/imageCompression.js';

export default function PreviewPanel({
  title,
  imageUrl,
  size,
  badge,
  isLoading = false,
}) {
  return (
    <section className="preview-panel">
      <header className="preview-panel__header">
        <div>
          <p>{badge}</p>
          <h2>{title}</h2>
        </div>
        <strong>{size ? formatBytes(size) : '0 B'}</strong>
      </header>

      <div className="preview-panel__stage">
        {imageUrl ? (
          <img className="preview-image" src={imageUrl} alt={title} />
        ) : (
          <div className="preview-empty">等待图片</div>
        )}
        {isLoading ? <div className="preview-busy">编码中</div> : null}
      </div>
    </section>
  );
}
