/* ==========================================================================
   VIBENCODE / SHARED BEHAVIOUR
   Loaded by every page. Only what more than one page needs: the cursor
   stream that grounds the lilac sections, and the measurement that keeps it
   off the header and the footer.

   Everything specific to the home page lives in home.js.
   ========================================================================== */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* One field, built once from all six pairs, painted into both lilac sections.
   Each section tracks the pointer in its own coordinates, so the reveal
   follows the cursor correctly in whichever one it is over. */
/* Any section marked data-stream gets the field. It is the two lilac grounds
   today - the home hero and the contact block - and the head of every inner
   page. */
const streamHosts = [...document.querySelectorAll("[data-stream]")];

(function buildStream() {
  if (!streamHosts.length || typeof services === "undefined") return;
  const tokens = [];
  Object.keys(services).forEach(key => {
    const source = services[key].said + " " + services[key].became;
    source.replace(/[^A-Za-z0-9 -]/g, "").split(/\s+/).forEach(word => {
      if (word) tokens.push(word);
    });
  });
  const parts = [];
  for (let i = 0; i < 1500; i++) {
    const token = tokens[(i * 7) % tokens.length];
    parts.push(i % 19 === 0 ? "<b>" + token + "</b>" : token);
  }
  // Built from the fixed service copy in data.js, never from user input.
  const markup = parts.join(" \u00b7 ");
  document.querySelectorAll(".fx-stream").forEach(node => { node.innerHTML = markup; });
})();

/* The reveal stops at whatever header or footer the section contains, measured
   rather than hard-coded: header heights change across breakpoints and the
   footer wraps to more rows on a phone. */
function fitStreams() {
  streamHosts.forEach(host => {
    const box = host.getBoundingClientRect();
    const header = host.querySelector(".header");
    const footer = host.querySelector(".footer, .site-footer");
    host.style.setProperty("--fx-top",
      header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom - box.top)) + "px" : "0px");
    host.style.setProperty("--fx-bottom",
      footer ? Math.max(0, Math.round(box.bottom - footer.getBoundingClientRect().top)) + "px" : "0px");
  });
}

fitStreams();
addEventListener("resize", fitStreams);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStreams);

let fitQueued = false;
addEventListener("scroll", () => {
  if (fitQueued) return;
  fitQueued = true;
  requestAnimationFrame(() => { fitQueued = false; fitStreams(); });
}, { passive: true });

streamHosts.forEach(host => {
  if (!host) return;
  let queued = false;
  let point = { x: 0, y: 0 };
  const write = () => {
    queued = false;
    host.style.setProperty("--mx", point.x + "px");
    host.style.setProperty("--my", point.y + "px");
  };
  host.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse") return;
    const rect = host.getBoundingClientRect();
    point = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) };
    if (!queued) { queued = true; requestAnimationFrame(write); }
  });
  /* Parked off-canvas, so the reveal stays closed until a pointer arrives. */
  host.addEventListener("pointerleave", () => {
    host.style.setProperty("--mx", "-400px");
    host.style.setProperty("--my", "-400px");
  });
});
