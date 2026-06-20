import { AdminFlow } from './pages/AdminFlow';
import { AccountFlow } from './pages/AccountFlow';
import { DuelFlow } from './pages/DuelFlow';
import { GroupFlow } from './pages/GroupFlow';
import { JoinFlow } from './pages/JoinFlow';
import { Gallery } from './pages/Gallery';
import { SoloFlow } from './pages/SoloFlow';

/**
 * App entry. The solo game flow is the default; the other modes and admin are
 * reached by query param (no router library):
 *   ?duel  → challenge a friend (creator)
 *   ?group → play together (host)
 *   ?join=CODE → join landing (duel opponent / group player)
 *   ?account → optional sign up / log in / reset
 *   ?admin → admin sign-in + analytics
 *   ?gallery → Phase 0 component gallery
 */
export function App(): JSX.Element {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  if (params.has('admin')) {
    return <AdminFlow />;
  }
  if (params.has('account')) {
    return <AccountFlow />;
  }
  if (params.has('join')) {
    return <JoinFlow code={params.get('join') ?? ''} />;
  }
  if (params.has('duel')) {
    return <DuelFlow />;
  }
  if (params.has('group')) {
    return <GroupFlow />;
  }
  return params.has('gallery') ? <Gallery /> : <SoloFlow />;
}
