import { useState } from 'react';
import { Button } from './Button';
import { copyText, canNativeShare, shareLink } from '../lib/share';

export interface InviteActionsProps {
  /** The join URL to copy/share (e.g. https://trivyy.com/?join=ABCDE). */
  readonly url: string;
  readonly code: string;
}

/**
 * Copy-link + native Share buttons for a game invite. The QR is for people in
 * the room; these let the host send the join link to anyone remotely.
 */
export function InviteActions(props: InviteActionsProps): JSX.Element {
  const { url, code } = props;
  const [copied, setCopied] = useState(false);

  const onCopy = async (): Promise<void> => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      <div style={{ display: 'flex', gap: '9px' }}>
        <Button variant="secondary" onClick={() => void onCopy()}>
          {copied ? 'Copied!' : 'Copy invite link'}
        </Button>
        {canNativeShare() ? (
          <Button
            variant="primary"
            onClick={() => void shareLink('Join my Trivyy game', `Game code: ${code}`, url)}
          >
            Share
          </Button>
        ) : null}
      </div>
    </div>
  );
}
