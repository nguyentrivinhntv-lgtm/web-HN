import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SpaceGallery from './SpaceGallery.jsx'

function Router() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (route === '#space-gallery') {
    return <SpaceGallery />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
