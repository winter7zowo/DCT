import { useEffect, useState } from 'react';
import CompressorPage from './pages/CompressorPage.jsx';
import ManualDctPage from './pages/ManualDctPage.jsx';

function getCurrentPage() {
  return window.location.hash === '#/dct' ? 'dct' : 'jpeg';
}

export default function App() {
  const [page, setPage] = useState(getCurrentPage);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getCurrentPage());
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return page === 'dct' ? <ManualDctPage /> : <CompressorPage />;
}
