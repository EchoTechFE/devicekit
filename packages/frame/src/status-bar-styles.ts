/**
 * Status bar rules for `<device-frame>`'s shadow DOM — split out of
 * styles.ts so that file stays under the repo's file-length ratchet.
 *
 * Geometry is read-only here: status-bar.ts is the single owner of where the
 * time, glyph cluster and cutout sit (status-bar-layout.ts computes it), and
 * writes it onto \`.status-bar\` as \`data-layout\` plus \`--sb-*\` custom
 * properties. This file only turns those numbers into paint.
 */
export const STATUS_BAR_STYLES = `
/*
 * Status bar: pinned to the device top, above whatever the screen slot renders.
 * pointer-events:none so it never steals taps from the content beneath it. It
 * is itself \`position: absolute\`, which is what makes it the positioning
 * context .status-bar__time and .status-bar__icons place themselves against.
 */
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
}

/* An author \`display\` outranks the UA sheet's \`[hidden] { display: none }\`, so
   any element styled with one needs its own hidden rule or the property does
   nothing. This is the bar that iOS landscape, status-bar="hidden" and embedded
   all switch off. */
.status-bar[hidden] {
  display: none;
}

/* Duo's status strip occupies the trailing edge. Its own width limits any
   status-bar background paint to that strip. */
.status-bar[data-edge="right"] {
  top: 0;
  right: 0;
  bottom: 0;
  left: auto;
}

/* Left-anchored at --sb-time-left; ios-classic leaves that variable unset, so
   the var() fallback (50%) plus the translateX below centers it instead. */
.status-bar__time {
  position: absolute;
  top: var(--sb-center-y, 50%);
  left: var(--sb-time-left, 50%);
  transform: translateY(-50%);
  font-size: calc(16px * var(--sb-scale, 1));
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.status-bar[data-layout="ios-classic"] .status-bar__time {
  transform: translate(-50%, -50%);
}

/* Duo uses a dedicated open-ring connectivity glyph next to time. The four
   dots close its lower edge; they are part of the glyph, not privacy lights. */
.status-bar[data-layout="ios-duo"] .status-bar__battery {
  display: none;
}

.status-bar[data-layout="ios-duo"] .status-bar__signal {
  display: none;
}

.status-bar[data-layout="ios-duo"] .status-bar__wifi {
  position: relative;
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 0;
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  box-shadow: none;
  -webkit-mask: none;
  mask: none;
}

.status-bar[data-layout="ios-duo"] .status-bar__wifi::after {
  content: none;
}

.status-bar[data-layout="ios-duo"] .status-bar__wifi::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 2px;
  width: 36px;
  height: 40px;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 40'><g fill='none' stroke='black' stroke-width='3' stroke-linecap='round'><path d='M4 29.5A16 16 0 1 1 32 29.5'/><path d='M10.5 17.5c4.2-3.8 10.8-3.8 15 0'/><path d='M14.2 21.7c2.1-1.9 5.5-1.9 7.6 0'/></g><g fill='black'><circle cx='18' cy='25.8' r='2'/><circle cx='9' cy='35' r='2'/><circle cx='15' cy='37.8' r='2'/><circle cx='21' cy='37.8' r='2'/><circle cx='27' cy='35' r='2'/></g></svg>") no-repeat center / contain;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 40'><g fill='none' stroke='black' stroke-width='3' stroke-linecap='round'><path d='M4 29.5A16 16 0 1 1 32 29.5'/><path d='M10.5 17.5c4.2-3.8 10.8-3.8 15 0'/><path d='M14.2 21.7c2.1-1.9 5.5-1.9 7.6 0'/></g><g fill='black'><circle cx='18' cy='25.8' r='2'/><circle cx='9' cy='35' r='2'/><circle cx='15' cy='37.8' r='2'/><circle cx='21' cy='37.8' r='2'/><circle cx='27' cy='35' r='2'/></g></svg>") no-repeat center / contain;
}

/* iPad's own time ink runs narrower than an iPhone's at the same nominal
   size (measured: 22.5px vs 28.7px wide), so its font-size is cut on top of
   the ordinary scale rather than folded into it. */
.status-bar[data-layout="ipad"] .status-bar__time {
  font-size: calc(16px * var(--sb-scale, 1) * 0.8);
}

.status-bar[data-layout="android"] .status-bar__time {
  font-size: 14px;
  font-weight: 400;
}

/* Size, corner radius and both offsets are written inline from the resolved
   cutout — a cutout is not always centered, so nothing here may place it. */
.status-bar__notch {
  position: absolute;
  background: var(--device-cutout-color);
}

/* Apple's outer-display render exposes a small lens reflection inside the
   punch-hole instead of a featureless black disc. */
.status-bar[data-layout="ios-duo"] .status-bar__notch[data-shape="circle"] {
  background: radial-gradient(circle at 52% 48%, #65719a 0 4%, #151721 10% 24%, #050509 30% 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

/*
 * A notch's bottom corners are rounded (cutoutBorderRadius), but where it meets
 * the screen's top edge a real phone curves the OTHER way — the edge sweeps
 * outward around the notch rather than cutting a straight corner. Two 6px
 * squares astride the top corners, each a radial gradient centered on the
 * corner nearest the notch, draw that outward curve; a pill or punch-hole
 * floats clear of the edge and needs none of this.
 */
.status-bar__notch[data-shape="notch"]::before,
.status-bar__notch[data-shape="notch"]::after {
  content: "";
  position: absolute;
  top: 0;
  width: 6px;
  height: 6px;
}

.status-bar__notch[data-shape="notch"]::before {
  left: -6px;
  background: radial-gradient(circle at bottom left, transparent 6px, var(--device-cutout-color) 6.5px);
}

.status-bar__notch[data-shape="notch"]::after {
  right: -6px;
  background: radial-gradient(circle at bottom right, transparent 6px, var(--device-cutout-color) 6.5px);
}

/* Right-anchored at --sb-trailing — the battery's own outline, not counting
   the nub pseudo-element that floats past it (see .status-bar__battery::after). */
.status-bar__icons {
  position: absolute;
  top: var(--sb-center-y, 50%);
  right: var(--sb-trailing, 14px);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: calc(5.5px * var(--sb-scale, 1));
}

.status-bar__icons[hidden] {
  display: none;
}

/*
 * ios-classic splits this cluster the way a real pre-notch status bar does:
 * signal+Wi-Fi sit next to the carrier name on the left, battery on the
 * right. Both --sb-leading-icons and --sb-trailing bound the row, so
 * \`margin-left: auto\` on the battery alone is enough to push just it to the
 * row's right edge while signal/wifi keep their ordinary left-packed gap.
 */
.status-bar[data-layout="ios-classic"] .status-bar__icons {
  left: var(--sb-leading-icons);
}

.status-bar[data-layout="ios-classic"] .status-bar__battery {
  margin-left: auto;
}

.status-bar[data-layout="android"] .status-bar__icons {
  gap: 7.5px;
}

/* Keep generic right-edge strips independent of the ios-classic/iPad/Android
   arrangements above: status glyphs occupy the first 56px, then the vertical
   time starts at 80px. Duo overrides this below with horizontal time. */
.status-bar[data-edge="right"][data-layout] .status-bar__icons {
  top: 12px;
  right: auto;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
  gap: 5px;
}

.status-bar[data-edge="right"][data-layout] .status-bar__time {
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  writing-mode: vertical-rl;
}

/* Without a camera in the upper track, Duo's compact side status begins near
   the corner. The outer portrait override below makes room for its camera. */
.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__time {
  top: 33px;
  right: auto;
  left: calc(50% - 24px);
  font-size: 15px;
  writing-mode: horizontal-tb;
}

.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__icons {
  top: 53px;
  right: auto;
  left: calc(50% - 24px);
}

.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__time {
  top: 77px;
  left: calc(50% - 26px);
  font-size: 16px;
}

.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__icons {
  top: 100px;
  left: calc(50% - 25px);
}

.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__wifi::before {
  left: 2px;
  width: 40px;
  height: 43px;
}

.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__wifi::before {
  top: 1px;
  left: 1px;
  width: 42px;
  height: 46px;
}

/* Inner Duo's 24px top strip is shorter than its 44px indicator. Pin the
   indicator to the screen instead of centering it on the strip, so it stays
   wholly inside the screen and the time remains in the same top row. */
.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__icons {
  top: 22px;
  right: 22px;
  left: auto;
  transform: none;
}

.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__time {
  top: 48px;
  right: 72px;
  left: auto;
  transform: translateY(-50%);
}

.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__wifi::before {
  top: 1px;
  left: 3px;
  width: 39px;
  height: 43px;
}

/* Glyph stand-ins drawn from the current foreground color, which follows the
   active page's navigation-bar text style. */
.status-bar__signal,
.status-bar__wifi,
.status-bar__battery {
  display: block;
  background: currentColor;
}

.status-bar__signal {
  width: calc(17px * var(--sb-scale, 1));
  height: calc(10.7px * var(--sb-scale, 1));
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 11'><rect x='0' y='8' width='3' height='3' rx='1'/><rect x='4.5' y='6' width='3' height='5' rx='1'/><rect x='9' y='3' width='3' height='8' rx='1'/><rect x='13.5' y='0' width='3' height='11' rx='1'/></svg>") no-repeat center / contain;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 11'><rect x='0' y='8' width='3' height='3' rx='1'/><rect x='4.5' y='6' width='3' height='5' rx='1'/><rect x='9' y='3' width='3' height='8' rx='1'/><rect x='13.5' y='0' width='3' height='11' rx='1'/></svg>") no-repeat center / contain;
}

.status-bar__wifi {
  width: calc(15.3px * var(--sb-scale, 1));
  height: calc(11px * var(--sb-scale, 1));
  border-radius: 1px;
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11'><path d='M8 2.2c2.3 0 4.4.9 6 2.4l-1.4 1.5C11.4 4.9 9.8 4.2 8 4.2S4.6 4.9 3.4 6.1L2 4.6C3.6 3.1 5.7 2.2 8 2.2zm0 3.5c1.3 0 2.5.5 3.4 1.4L10 8.6c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8L4.6 7.1C5.5 6.2 6.7 5.7 8 5.7zm0 3.3l1.4 1.4c-.4.4-.9.6-1.4.6s-1-.2-1.4-.6L8 9z'/></svg>") no-repeat center / contain;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11'><path d='M8 2.2c2.3 0 4.4.9 6 2.4l-1.4 1.5C11.4 4.9 9.8 4.2 8 4.2S4.6 4.9 3.4 6.1L2 4.6C3.6 3.1 5.7 2.2 8 2.2zm0 3.5c1.3 0 2.5.5 3.4 1.4L10 8.6c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8L4.6 7.1C5.5 6.2 6.7 5.7 8 5.7zm0 3.3l1.4 1.4c-.4.4-.9.6-1.4.6s-1-.2-1.4-.6L8 9z'/></svg>") no-repeat center / contain;
}

.status-bar[data-layout="android"] .status-bar__signal,
.status-bar[data-layout="android"] .status-bar__wifi {
  width: 13px;
  height: 12.6px;
}

.status-bar__battery {
  /* Outline measured 24.5×11.5 including the stroke, so the border must not add to it. */
  box-sizing: border-box;
  width: calc(24.5px * var(--sb-scale, 1));
  height: calc(11.5px * var(--sb-scale, 1));
  border: 1px solid currentColor;
  border-radius: 3px;
  background: transparent;
  position: relative;
}

.status-bar__battery::before {
  content: "";
  position: absolute;
  inset: calc(2px * var(--sb-scale, 1));
  right: calc(8px * var(--sb-scale, 1));
  border-radius: 1px;
  background: currentColor;
}

/* The nub: absolutely positioned past the element's own right edge, so it
   never widens .status-bar__battery's own bounding box — the outline alone
   is what --sb-trailing is measured to. */
.status-bar__battery::after {
  content: "";
  position: absolute;
  top: calc(3px * var(--sb-scale, 1));
  bottom: calc(3px * var(--sb-scale, 1));
  right: calc(-3px * var(--sb-scale, 1));
  width: calc(2px * var(--sb-scale, 1));
  border-radius: 0 1px 1px 0;
  background: currentColor;
}

/* Android draws its battery standing up rather than lying down; the nub and
   fill insets follow the same swap. */
.status-bar[data-layout="android"] .status-bar__battery {
  width: 7.6px;
  height: 13px;
}

.status-bar[data-layout="android"] .status-bar__battery::before {
  inset: 2px;
  right: 2px;
  bottom: 4px;
}

.status-bar[data-layout="android"] .status-bar__battery::after {
  top: -3px;
  bottom: auto;
  left: 2px;
  right: 2px;
  width: auto;
  height: 2px;
  border-radius: 1px 1px 0 0;
}
`
