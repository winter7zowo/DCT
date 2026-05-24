export default function PageNav({ activePage }) {
  return (
    <nav className="page-nav" aria-label="工具切换">
      <a className={activePage === 'jpeg' ? 'is-active' : ''} href="#/">
        JPEG 编码
      </a>
      <a className={activePage === 'dct' ? 'is-active' : ''} href="#/dct">
        手写 DCT
      </a>
    </nav>
  );
}
