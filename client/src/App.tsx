import { Gallery } from './pages/Gallery';
import { SoloFlow } from './pages/SoloFlow';

/**
 * App entry. The real solo game flow is the default; the Phase 0 component
 * gallery stays reachable at `?gallery` for design reference.
 */
export function App(): JSX.Element {
  const showGallery =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('gallery');

  return showGallery ? <Gallery /> : <SoloFlow />;
}
