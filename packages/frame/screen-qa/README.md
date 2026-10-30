# Screen-fidelity QA page

Renders `.screen` with solid colored pads into every screen corner so continuous /
circular clip fidelity is visible in screenshots.

Frames use **`immersive`** so pads extend under the transparent status bar. Without
that, top content starts below the status strip and continuous corners read as a
white horizontal cap.

## URL modes

| URL | What renders |
| --- | --- |
| `/` | Classic P0 six (iPhone 17 Pro, Duo outer/inner, Galaxy S24 / Ultra, Pixel 9 Pro) |
| `/?all=1` | Every preset in `@devicekit/devices` `DEVICES` |
| `/?device=<exact name>` | One device (exact `DeviceProfile.name`, URL-encoded) |

## Serve locally

From the repo root (uses workspace TypeScript sources via Vite aliases — no build step):

```sh
pnpm --filter @devicekit/frame exec vite --config screen-qa/vite.config.ts --host 127.0.0.1
```

Then open **http://127.0.0.1:5179/** (or `/?all=1`, `/?device=iPhone%2017%20Pro`).

From `packages/frame`:

```sh
../../node_modules/.bin/vite --config screen-qa/vite.config.ts --host 127.0.0.1
```

Accept on the **screen content continuous/circular silhouette** (color meets black
bezel along the corner). Outer chrome should be rounded and concentric. No side buttons.

Headless capture of every preset writes to `/workspace/devicekit-qa-shots/all-devices/`
via `scripts/shot-all-devices.mjs` (separate Chrome process, not the desktop browser).
