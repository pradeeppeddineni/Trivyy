import { AdminFlow } from './pages/AdminFlow';
import { AccountFlow } from './pages/AccountFlow';
import { FriendsFlow } from './pages/FriendsFlow';
import { GroupsFlow } from './pages/GroupsFlow';
import { ProfileFlow } from './pages/ProfileFlow';
import { DuelFlow } from './pages/DuelFlow';
import { GroupFlow } from './pages/GroupFlow';
import { JoinFlow } from './pages/JoinFlow';
import { Gallery } from './pages/Gallery';
import { SoloFlow } from './pages/SoloFlow';
import { BottomNav } from './components/BottomNav';
import { PageTransition } from './components/PageTransition';
import { SettingsFlow } from './pages/SettingsFlow';
import { activeTab } from './nav';

/**
 * App entry. The solo game flow is the default; the other modes and admin are
 * reached by query param (no router library):
 *   ?duel  → challenge a friend (creator)
 *   ?group → play together (host)
 *   ?join=CODE → join landing (duel opponent / group player)
 *   ?account → optional sign up / log in / reset
 *   ?admin → admin sign-in + analytics
 *   ?gallery → Phase 0 component gallery
 *   ?settings → user settings (theme, profile links)
 */
export function App(): JSX.Element {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  if (params.has('settings')) {
    return <SettingsFlow />;
  }

  const tab = activeTab(params);

  // Non-tab screens: no bottom nav, no page transition (game flows, admin, etc.)
  if (params.has('admin')) return <AdminFlow />;
  if (params.has('account')) return <AccountFlow />;
  if (params.has('join')) return <JoinFlow code={params.get('join') ?? ''} />;
  if (params.has('duel')) return <DuelFlow />;
  if (params.has('group')) return <GroupFlow groupId={params.get('for') ?? undefined} />;
  if (params.has('gallery')) return <Gallery />;

  // Tab screens: wrapped in PageTransition keyed on the active tab so the
  // fade-and-rise plays when navigating between tabs, not within a flow.
  let tabScreen: JSX.Element;
  if (params.has('friend')) tabScreen = <FriendsFlow inviteCode={params.get('friend') ?? ''} />;
  else if (params.has('friends')) tabScreen = <FriendsFlow />;
  else if (params.has('gjoin')) tabScreen = <GroupsFlow autoJoinCode={params.get('gjoin') ?? ''} />;
  else if (params.has('groups')) tabScreen = <GroupsFlow />;
  else if (params.has('me')) tabScreen = <ProfileFlow />;
  else tabScreen = <SoloFlow />;

  return (
    <>
      <PageTransition key={tab ?? 'home'}>{tabScreen}</PageTransition>
      {tab !== null && <BottomNav active={tab} />}
    </>
  );
}
