import { useRef, useState } from 'react';

export default function ImageDropZone({ imageFile, onFileSelect, onClear }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFiles = (files) => {
    const [file] = Array.from(files || []);
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <section
      className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="file-input"
        type="file"
        accept="image/*"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="drop-zone__content">
        <div>
          <p className="drop-zone__eyebrow">单张图片</p>
          <h2>{imageFile ? imageFile.name : '导入图片'}</h2>
        </div>
        <div className="drop-zone__actions">
          <button className="button button--primary" type="button" onClick={openPicker}>
            选择图片
          </button>
          {imageFile ? (
            <button className="button button--ghost" type="button" onClick={onClear}>
              清空
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
