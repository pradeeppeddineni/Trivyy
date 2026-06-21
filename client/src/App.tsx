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

  let screen: JSX.Element;
  if (params.has('admin')) screen = <AdminFlow />;
  else if (params.has('account')) screen = <AccountFlow />;
  else if (params.has('friend')) screen = <FriendsFlow inviteCode={params.get('friend') ?? ''} />;
  else if (params.has('friends')) screen = <FriendsFlow />;
  else if (params.has('gjoin')) screen = <GroupsFlow autoJoinCode={params.get('gjoin') ?? ''} />;
  else if (params.has('groups')) screen = <GroupsFlow />;
  else if (params.has('me')) screen = <ProfileFlow />;
  else if (params.has('join')) screen = <JoinFlow code={params.get('join') ?? ''} />;
  else if (params.has('duel')) screen = <DuelFlow />;
  else if (params.has('group')) screen = <GroupFlow groupId={params.get('for') ?? undefined} />;
  else if (params.has('gallery')) screen = <Gallery />;
  else screen = <SoloFlow />;

  return (
    <>
      {screen}
      {tab !== null && <BottomNav active={tab} />}
    </>
  );
}
