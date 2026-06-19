import { AdminFlow } from './pages/AdminFlow';
import { Gallery } from './pages/Gallery';
import { SoloFlow } from './pages/SoloFlow';

/**
 * App entry. The real solo game flow is the default; `?admin` opens admin
 * sign-in and `?gallery` shows the Phase 0 component gallery for design
 * reference (query-param routing — no router library).
 */
export function App(): JSX.Element {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  if (params.has('admin')) {
    return <AdminFlow />;
  }
  return params.has('gallery') ? <Gallery /> : <SoloFlow />;
}
