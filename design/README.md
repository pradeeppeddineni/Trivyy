# Design source

This folder is the source of truth for the Trivyy UI design produced with **Claude Design**.

## Contents

- `Trivyy.dc.html` — the exported interactive prototype (a Claude Design `.dc.html` document: a custom `<x-dc>` state machine, **not** React).
- `support.js` — the prototype runtime it loads.

> These files are a **prototype**, not shippable code. They are the visual and interaction spec. The React app under `client/` re-implements them; it does not import them.

## Re-pulling from Claude Design

The design lives in the Claude Design project below and can be re-pulled with the **DesignSync** MCP tool (read methods need the `user:design:read` scope; run `/design-login` if a session lacks it).

- Project URL: https://claude.ai/design/p/1f1b8460-2310-47e0-be3f-2788ec04ec1e?file=Trivyy.dc.html
- Project id: `1f1b8460-2310-47e0-be3f-2788ec04ec1e`
- File: `Trivyy.dc.html`

To refresh: `DesignSync get_file` for the project id + path, then overwrite the files here.

## Where design output lands in the app

| Asset | Location |
| --- | --- |
| Design tokens (color, type, spacing, motion) | `client/src/styles/tokens.css` |
| Reusable React components | `client/src/components/` |
| Logos, icons, images (bundled, fingerprinted) | `client/src/assets/` |
| Self-hosted fonts (if/when) | `client/src/assets/fonts/` |
| Static fixed-URL files (favicon, apple-touch-icon, og-image, manifest) | `client/public/` |

See `.specify/implementation-plan.md` (Phase 0) for how the prototype is translated into the component library, and ADR `docs/adr/0003-three-modes-and-polling.md` for scope.
