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

/* Paint families are profile data, not brand guesses made by the renderer.
   HarmonyOS deliberately reuses Android's topology geometry while painting
   independently; this is a geometry reuse, not a claim of complete device
   measurement. */
.status-bar[data-style="ios"] {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
}

.status-bar[data-style="android-stock"] {
  font-family: Roboto, 'Noto Sans', sans-serif;
}

.status-bar[data-style="android-samsung"] {
  font-family: "SamsungOne", Roboto, sans-serif;
}

.status-bar[data-style="android-hyperos"] {
  font-family: "MiSans", Roboto, "Noto Sans SC", sans-serif;
}

.status-bar[data-style="harmony"] {
  font-family: "HarmonyOS Sans", 'Noto Sans SC', sans-serif;
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
  transform: none;
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

.status-bar[data-style="android-stock"] .status-bar__time {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
}

.status-bar[data-style="android-samsung"] .status-bar__time {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.15px;
}

.status-bar[data-style="android-hyperos"] .status-bar__time {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

.status-bar[data-style="harmony"] .status-bar__time {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
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

/* Right-anchored at --sb-trailing — the battery host's own visual box. */
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

/* Notch ears keep the older, compact glyph row; Dynamic Island phones leave
   a little more air around their larger island-era glyphs. The parent shape is
   published by status-bar.ts so these rules stay independent of device names. */
.status-bar[data-cutout-shape="notch"] .status-bar__icons {
  gap: calc(5px * var(--sb-scale, 1));
}

.status-bar[data-cutout-shape="pill"] .status-bar__icons {
  gap: calc(6px * var(--sb-scale, 1));
}

.status-bar[data-cutout-shape="pill"] .status-bar__signal {
  width: calc(18px * var(--sb-scale, 1));
  height: calc(11.5px * var(--sb-scale, 1));
}

.status-bar[data-cutout-shape="notch"] .status-bar__signal {
  width: calc(17px * var(--sb-scale, 1));
  height: calc(10.7px * var(--sb-scale, 1));
}

/* iPad's wider, shallower strip uses a smaller icon row than either iPhone
   generation, while retaining the same project-owned masks. */
.status-bar[data-layout="ipad"] .status-bar__signal,
.status-bar[data-layout="ipad"] .status-bar__wifi {
  width: 14px;
  height: 10px;
}

.status-bar[data-style="android-stock"] .status-bar__icons {
  gap: 7.5px;
}

.status-bar[data-style="android-samsung"] .status-bar__icons {
  gap: 6px;
}

.status-bar[data-style="android-hyperos"] .status-bar__icons {
  gap: 5.5px;
}

.status-bar[data-style="harmony"] .status-bar__icons {
  gap: 5px;
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

/* Hosts carry flex geometry; pseudo-elements carry the visible ink. */
.status-bar__signal,
.status-bar__wifi,
.status-bar__battery {
  display: block;
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  background: transparent;
  border: 0;
}

.status-bar__signal::before,
.status-bar__wifi::before,
.status-bar__battery::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  background: currentColor;
}

.status-bar__signal::before {
  width: calc(var(--sb-signal-ink-width, 17px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-ink-height, 10.7px) * var(--sb-scale, 1));
  transform: translate(-50%, calc(-50% + var(--sb-signal-ink-offset-y, 0px) * var(--sb-scale, 1)));
  -webkit-mask: var(--device-status-bar-signal-image, var(--status-bar-signal-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 11'><rect x='0' y='8' width='3' height='3' rx='1'/><rect x='4.5' y='6' width='3' height='5' rx='1'/><rect x='9' y='3' width='3' height='8' rx='1'/><rect x='13.5' y='0' width='3' height='11' rx='1'/></svg>"))) no-repeat center / contain;
  mask: var(--device-status-bar-signal-image, var(--status-bar-signal-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 11'><rect x='0' y='8' width='3' height='3' rx='1'/><rect x='4.5' y='6' width='3' height='5' rx='1'/><rect x='9' y='3' width='3' height='8' rx='1'/><rect x='13.5' y='0' width='3' height='11' rx='1'/></svg>"))) no-repeat center / contain;
}

.status-bar__signal {
  width: calc(var(--sb-signal-width, 17px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 10.7px) * var(--sb-scale, 1));
}

.status-bar__wifi {
  width: var(--sb-wifi-width, calc(15.3px * var(--sb-scale, 1)));
  height: var(--sb-wifi-height, calc(11px * var(--sb-scale, 1)));
  border-radius: 1px;
}

.status-bar__wifi::before {
  width: calc(var(--sb-wifi-ink-width, 15.3px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-ink-height, 8.5px) * var(--sb-scale, 1));
  transform: translate(-50%, calc(-50% + var(--sb-wifi-ink-offset-y, 0px) * var(--sb-scale, 1)));
  -webkit-mask: var(--device-status-bar-wifi-image, var(--status-bar-wifi-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11'><path d='M8 2.2c2.3 0 4.4.9 6 2.4l-1.4 1.5C11.4 4.9 9.8 4.2 8 4.2S4.6 4.9 3.4 6.1L2 4.6C3.6 3.1 5.7 2.2 8 2.2zm0 3.5c1.3 0 2.5.5 3.4 1.4L10 8.6c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8L4.6 7.1C5.5 6.2 6.7 5.7 8 5.7zm0 3.3l1.4 1.4c-.4.4-.9.6-1.4.6s-1-.2-1.4-.6L8 9z'/></svg>"))) no-repeat center / contain;
  mask: var(--device-status-bar-wifi-image, var(--status-bar-wifi-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11'><path d='M8 2.2c2.3 0 4.4.9 6 2.4l-1.4 1.5C11.4 4.9 9.8 4.2 8 4.2S4.6 4.9 3.4 6.1L2 4.6C3.6 3.1 5.7 2.2 8 2.2zm0 3.5c1.3 0 2.5.5 3.4 1.4L10 8.6c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8L4.6 7.1C5.5 6.2 6.7 5.7 8 5.7zm0 3.3l1.4 1.4c-.4.4-.9.6-1.4-.6L8 9z'/></svg>"))) no-repeat center / contain;
}



/* Each family owns a different path and host/ink box. These values are
   family-level approximations, not vendor assets. */
.status-bar[data-style="android-stock"] .status-bar__signal {
  width: calc(var(--sb-signal-width, 13px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 12.6px) * var(--sb-scale, 1));
  --status-bar-signal-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 13'><path d='M1 12h2V9H1zm3 0h2V6H4zm3 0h2V3H7zm3 0h2V0h-2z'/></svg>");
}
.status-bar[data-style="android-stock"] .status-bar__wifi {
  width: calc(var(--sb-wifi-width, 13px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-height, 12.6px) * var(--sb-scale, 1));
  --status-bar-wifi-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 12'><path d='M7 1.2c-2.3 0-4.4.8-6 2.3l1.3 1.4C3.6 3.8 5.2 3.2 7 3.2s3.4.6 4.7 1.7L13 3.5c-1.6-1.5-3.7-2.3-6-2.3zm0 4c-1.2 0-2.3.4-3.1 1.2l1.4 1.5c.5-.4 1.1-.7 1.7-.7s1.2.3 1.7.7l1.4-1.5C9.3 5.6 8.2 5.2 7 5.2zm0 3.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'/></svg>");
}
.status-bar[data-style="android-stock"] .status-bar__battery {
  --status-bar-battery-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 13'><path fill='none' stroke='black' stroke-width='1' d='M1 2h6v10H1z'/><path d='M2 0h4v2H2zM2 4h4v6H2z'/></svg>");
}

.status-bar[data-style="android-samsung"] .status-bar__signal {
  width: calc(var(--sb-signal-width, 14px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 12px) * var(--sb-scale, 1));
  --status-bar-signal-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 12'><path d='M1 11h2V8H1zm3.5 0h2V5H4.5zm3.5 0h2V2H8zm3.5 0h2V0h-2z'/></svg>");
}
.status-bar[data-style="android-samsung"] .status-bar__wifi {
  width: calc(var(--sb-wifi-width, 14px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-height, 12px) * var(--sb-scale, 1));
  --status-bar-wifi-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 12'><path d='M7 1C4.5 1 2.2 2 .5 3.8L2 5.3A7 7 0 0 1 7 3.2c1.9 0 3.7.7 5 2.1l1.5-1.5A9 9 0 0 0 7 1zm0 4c-1.3 0-2.5.4-3.5 1.2L5 7.8a2.8 2.8 0 0 1 4 0l1.5-1.6A4.8 4.8 0 0 0 7 5zm0 4.3a1.3 1.3 0 1 0 0 2.6z'/></svg>");
}
.status-bar[data-style="android-samsung"] .status-bar__battery {
  --status-bar-battery-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 10'><path fill='none' stroke='black' stroke-width='1' d='M1 1h16v8H1z'/><path d='M17 3h2v4h-2zM3 3h9v4H3z'/></svg>");
}

/* Project-authored HyperOS family: no vendor files or system-font glyphs. */
.status-bar[data-style="android-hyperos"] .status-bar__signal {
  width: calc(var(--sb-signal-width, 13px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 12px) * var(--sb-scale, 1));
  --status-bar-signal-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 12'><path d='M1 11h2V8H1zm3 0h2V5H4zm3 0h2V2H7zm3 0h2V0h-2z'/></svg>");
}
.status-bar[data-style="android-hyperos"] .status-bar__wifi {
  width: calc(var(--sb-wifi-width, 14px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-height, 12px) * var(--sb-scale, 1));
  --status-bar-wifi-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 12'><path d='M7 1.1C4.4 1.1 2 2 .4 3.7L2 5.2C3.3 4 5 3.4 7 3.4s3.7.6 5 1.8l1.6-1.5C12 2 9.6 1.1 7 1.1zm0 3.8c-1.3 0-2.6.5-3.5 1.4L5 7.8c.6-.5 1.3-.8 2-.8s1.4.3 2 .8l1.5-1.5A5 5 0 0 0 7 4.9zm0 4.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z'/></svg>");
}
.status-bar[data-style="android-hyperos"] .status-bar__battery {
  --status-bar-battery-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 19 10'><path fill='none' stroke='black' stroke-width='1' d='M1 1h15v8H1z'/><path d='M16 3h2v4h-2zM3 3h10v4H3z'/></svg>");
}

.status-bar[data-style="harmony"] .status-bar__signal {
  width: calc(var(--sb-signal-width, 12px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 12px) * var(--sb-scale, 1));
  --status-bar-signal-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><g><rect x='1' y='8' width='2' height='3' rx='1'/><rect x='4' y='5' width='2' height='6' rx='1'/><rect x='7' y='2' width='2' height='9' rx='1'/><rect x='10' y='0' width='1' height='11' rx='.5'/></g></svg>");
}
.status-bar[data-style="harmony"] .status-bar__wifi {
  width: calc(var(--sb-wifi-width, 13px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-height, 11px) * var(--sb-scale, 1));
  --status-bar-wifi-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 11'><path d='M7 1C4.4 1 2 2 0 4l1.7 1.7A7.5 7.5 0 0 1 7 3.5c2 0 3.8.8 5.3 2.2L14 4A10 10 0 0 0 7 1zm0 3.4c-1.5 0-2.9.6-4 1.7l1.7 1.7A3.2 3.2 0 0 1 7 6.9c.9 0 1.7.3 2.3.9L11 6.1a5.6 5.6 0 0 0-4-1.7zm0 3.9a1.4 1.4 0 1 0 0 2.7z'/></svg>");
}
.status-bar[data-style="harmony"] .status-bar__battery {
  --status-bar-battery-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 12'><path fill='none' stroke='black' stroke-width='1' d='M1 2h6v9H1z'/><path d='M2 0h4v2H2zM2 4h4v5H2z'/></svg>");
}

/* Final host defaults keep row geometry independent from family path tokens. */
.status-bar__signal,
.status-bar__wifi,
.status-bar__battery {
  background: transparent;
  border: 0;
  -webkit-mask: none;
  mask: none;
}
.status-bar__signal {
  width: calc(var(--sb-signal-width, 17px) * var(--sb-scale, 1));
  height: calc(var(--sb-signal-height, 10.7px) * var(--sb-scale, 1));
}
.status-bar__wifi {
  width: calc(var(--sb-wifi-width, 15.3px) * var(--sb-scale, 1));
  height: calc(var(--sb-wifi-height, 11px) * var(--sb-scale, 1));
}
.status-bar__battery {
  width: calc(var(--sb-battery-width, 24.5px) * var(--sb-scale, 1));
  height: calc(var(--sb-battery-height, 11.5px) * var(--sb-scale, 1));
}
.status-bar__battery::before {
  width: calc(var(--sb-battery-ink-width, 24.5px) * var(--sb-scale, 1));
  height: calc(var(--sb-battery-ink-height, 11.5px) * var(--sb-scale, 1));
  transform: translate(-50%, calc(-50% + var(--sb-battery-ink-offset-y, 0px) * var(--sb-scale, 1)));
  -webkit-mask: var(--device-status-bar-battery-image, var(--status-bar-battery-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 12'><path fill='none' stroke='black' stroke-width='1' d='M1 1h20v10H1z'/><path d='M22 4h2v4h-2zM3 3h12v6H3z'/></svg>"))) no-repeat center / contain;
  mask: var(--device-status-bar-battery-image, var(--status-bar-battery-mask, url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 12'><path fill='none' stroke='black' stroke-width='1' d='M1 1h20v10H1z'/><path d='M22 4h2v4h-2zM3 3h12v6H3z'/></svg>"))) no-repeat center / contain;
}
/* Duo's connectivity indicator is a topology glyph, not a family-specific
   Wi-Fi glyph. Keep this rule after the family paint rules so a legal custom
   profile that overrides statusBarStyle cannot shrink or mask its 44px host. */
.status-bar[data-layout="ios-duo"] .status-bar__wifi {
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

`
