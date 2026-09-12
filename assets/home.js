/* ==========================================================================
   VIBENCODE / HOME
   Home-page behaviour only. Requires data.js and site.js before it.
   ========================================================================== */

/* ======================================================
   CONFIGURATION
   Replace the placeholder before publishing.
   ====================================================== */
const CONTACT_EMAIL = "hello@vibencode.com";

/* ======================================================
   THE MOTIF IS LANGUAGE
   ---------------------------------------------------------
   Two earlier attempts put a picture here: an abstract pleated V, then a set
   of invented "deliverable sheets". Both failed for the same reason: an
   agency that draws a diagram of work it has not done is drawing stock art.

   So the recurring element is not an image. It is a pair of sentences: what a
   client actually says in the first meeting, and what that becomes once it
   has been engineered. Six pairs, one per service. The pair runs the hero,
   sits inside each service panel, and prints on the posters.

   It cannot go stale, it cannot look generic, and it is the only motif that
   demonstrates the thing the company sells instead of decorating it.
   ====================================================== */

const NS = "http://www.w3.org/2000/svg";

function add(parent, name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  parent.appendChild(node);
  return node;
}


/* ======================================================
   SERVICE STORYTELLING
   Content is v4's, unchanged. What is new is that each service now carries
   its own sheet, so the six of them stop looking identical.
   ====================================================== */


const serviceButtons = [...document.querySelectorAll("[data-service]")];
const featureContent = document.getElementById("feature-content");
const serviceContact = document.getElementById("service-contact");

function setInterest(interest) {
  document.getElementById("contact-context").textContent =
    interest ? `Starting point / ${interest}` : "Tell us where you want to start.";

  /* Was a mailto, which is the thing that loses people: it needs a configured
     desktop client, it fails silently in webmail, and nothing is recorded
     either way. The enquiry page opens with this service already chosen. */
  document.getElementById("email-link").href =
    interest ? `/contact/?area=${encodeURIComponent(interest)}` : "/contact/";
}

function selectService(key) {
  const service = services[key];

  serviceButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.service === key));
  });

  document.getElementById("feature-code").textContent = service.code;

  const title = document.getElementById("feature-title");
  title.replaceChildren(
    document.createTextNode(service.title[0]),
    document.createElement("br"),
    document.createTextNode(service.title[1])
  );

  document.getElementById("feature-copy").textContent = service.description;

  const outputs = document.getElementById("feature-outputs");
  outputs.replaceChildren();

  service.outputs.forEach(output => {
    const item = document.createElement("li");
    item.textContent = output;
    outputs.appendChild(item);
  });

  serviceContact.replaceChildren(
    document.createTextNode(service.cta),
    Object.assign(document.createElement("span"), { textContent: " ↗" })
  );
  serviceContact.dataset.interest = service.interest;

  document.getElementById("feature-said").textContent = "“" + service.said + "”";
  document.getElementById("feature-became").textContent = service.became;

  featureContent.classList.remove("feature-enter");
  void featureContent.offsetWidth;
  featureContent.classList.add("feature-enter");
}

serviceButtons.forEach(button => {
  button.addEventListener("click", () => selectService(button.dataset.service));
});

document.querySelectorAll("[data-interest], #service-contact").forEach(link => {
  link.addEventListener("click", () => setInterest(link.dataset.interest));
});

selectService("genai");
setInterest("");

/* ======================================================
   THE HERO PAIR
   The same six pairs, cycling. The right-hand answer resolves word by word,
   which is the only motion in the hero: the ask arrives whole, the answer
   gets assembled. It stops on focus, on a pointer resting on the sentence
   itself, and when scrolled away.
   ====================================================== */

const heroSaid = document.getElementById("hero-said");
const heroBecame = document.getElementById("hero-became");
const heroStage = document.getElementById("hero-stage");
const pairDots = [...document.querySelectorAll("[data-pair]")];
const pairJump = document.getElementById("pair-jump");
const pairKeys = pairDots.map(dot => dot.dataset.pair);

let pairIndex = 0;
let pairTimer = null;
let pairPaused = false;   /* keyboard focus is inside the stage */
let pairHeld = false;     /* a pointer is resting on the sentence itself */
let pairOnScreen = true;

function renderBecame(text) {
  heroBecame.replaceChildren();
  const words = text.split(" ");
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    heroBecame.append(span, document.createTextNode(" "));
    if (!reducedMotion.matches) {
      span.animate(
        [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 240, delay: i * 14, easing: "ease-out", fill: "backwards" }
      );
    }
  });
}

function showPair(index) {
  pairIndex = (index + pairKeys.length) % pairKeys.length;
  const key = pairKeys[pairIndex];
  const service = services[key];

  pairDots.forEach(dot => dot.setAttribute("aria-pressed", String(dot.dataset.pair === key)));

  heroSaid.textContent = service.said;
  if (!reducedMotion.matches) {
    heroSaid.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 320, easing: "ease-out" }
    );
  }
  renderBecame(service.became);

  pairJump.textContent = service.interest + " ↗";
  pairJump.dataset.pairService = key;
}

function nextPair() { showPair(pairIndex + 1); }

/* 6200 was too short to read the thing it was showing. The answer assembles
   over ~700ms, and what is left has to carry ~30 words of mono - call it
   eight to ten seconds of honest reading. The pair was being pulled out from
   under people mid-sentence, which is the opposite of what the rotation is
   for. */
const PAIR_DWELL = 9200;

function runPairs() {
  clearInterval(pairTimer);
  pairTimer = null;
  if (reducedMotion.matches || pairPaused || pairHeld || !pairOnScreen) return;
  pairTimer = setInterval(nextPair, PAIR_DWELL);
}

pairDots.forEach(dot => {
  dot.addEventListener("click", () => {
    showPair(pairKeys.indexOf(dot.dataset.pair));
    runPairs();
  });
});

/* Only keyboard focus holds the cycle: someone tabbing through the six needs
   it to stay put. Pointer hover used to pause it too, which meant a cursor
   resting anywhere over the hero stopped it for good and it read as static. */
heroStage.addEventListener("focusin", () => { pairPaused = true; runPairs(); });
heroStage.addEventListener("focusout", () => { pairPaused = false; runPairs(); });

/* Hover holds the cycle again - but bound to the two paragraphs rather than
   to the whole stage, which is what made it unusable before. A cursor parked
   anywhere in the hero used to stop the rotation for good and the poster read
   as static. Resting on the words you are actually reading holds them;
   resting anywhere else leaves the cycle alone. */
[heroSaid, heroBecame].forEach(node => {
  node.addEventListener("pointerenter", () => { pairHeld = true; runPairs(); });
  node.addEventListener("pointerleave", () => { pairHeld = false; runPairs(); });
});

pairJump.addEventListener("click", () => {
  selectService(pairJump.dataset.pairService);
  setInterest(services[pairJump.dataset.pairService].interest);
});

if ("IntersectionObserver" in window) {
  new IntersectionObserver(entries => {
    pairOnScreen = entries[0].isIntersecting;
    runPairs();
  }).observe(heroStage);
}
document.addEventListener("visibilitychange", () => {
  pairOnScreen = !document.hidden;
  runPairs();
});
reducedMotion.addEventListener("change", runPairs);

/* ------------------------------------------------------
   CURSOR GROUNDS
   One listener, coalesced to a frame, writing two custom properties. The
   grounds themselves are pure CSS, so nothing here runs unless the pointer
   actually moves and neither variant costs anything when it is not selected.
   ------------------------------------------------------ */

showPair(0);
runPairs();


/* ======================================================
   THE DELIVERY PATH
   v4 rotated a rule 13deg and offset the steps with hardcoded margins, so the
   line missed the markers at most widths. This measures where the numbers
   actually are and draws through them.
   ====================================================== */

const pathHost = document.getElementById("delivery-path");
const pathSvg = document.getElementById("delivery-line");
const practiceSection = document.getElementById("practice");
const briefBlock = document.getElementById("brief");
const briefParts = [...document.querySelectorAll(".brief-part")];
const briefCount = document.getElementById("brief-count");
const deliverySteps = [...document.querySelectorAll(".delivery-step")];
let deliveryPath = null;
let deliveryLength = 0;
let segmentStops = [0, 1 / 3, 2 / 3, 1];

function drawDeliveryLine() {
  const marks = [...pathHost.querySelectorAll(".step-number")];
  deliveryPath = null;
  if (!marks.length || getComputedStyle(pathSvg.parentElement).display === "none") return;

  const host = pathHost.getBoundingClientRect();
  if (!host.width) return;
  pathSvg.setAttribute("viewBox", "0 0 " + host.width + " " + host.height);
  while (pathSvg.firstChild) pathSvg.removeChild(pathSvg.firstChild);

  const points = marks.map(mark => {
    const box = mark.getBoundingClientRect();
    return {
      x: box.left - host.left + box.width / 2,
      y: box.top - host.top + box.height / 2
    };
  });

  let d = "";
  points.forEach((point, i) => {
    if (i === 0) { d += "M" + point.x + " " + point.y; return; }
    const prev = points[i - 1];
    const mx = (prev.x + point.x) / 2;
    d += " C" + mx + " " + prev.y + " " + mx + " " + point.y + " " + point.x + " " + point.y;
  });

  points.forEach(point => {
    add(pathSvg, "circle", { cx: point.x, cy: point.y, r: 3.5, fill: "#c9c1cf" });
  });
  deliveryPath = add(pathSvg, "path", {
    d: d, fill: "none", stroke: "#c9c1cf", "stroke-width": 1.4
  });
  deliveryLength = deliveryPath.getTotalLength();
  deliveryPath.setAttribute("stroke-dasharray", deliveryLength);

  /* Where along the path each step's dot sits. The segments are not equal, the staircase makes later ones longer, so drawing the line at a constant
     rate would have its head arrive at each number early, then late. Measuring
     each segment lets the head land on a dot exactly as that number inks. */
  segmentStops = [0];
  let running = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const mx = (prev.x + points[i].x) / 2;
    const seg = add(pathSvg, "path", {
      d: "M" + prev.x + " " + prev.y + " C" + mx + " " + prev.y + " " + mx + " " +
         points[i].y + " " + points[i].x + " " + points[i].y,
      fill: "none", stroke: "none"
    });
    running += seg.getTotalLength();
    seg.remove();
    segmentStops.push(running);
  }
  segmentStops = segmentStops.map(v => v / running);
  updatePractice();
}

/* ------------------------------------------------------
   THE SCROLL TRANSFORMATION
   Scroll position through this section drives three things at once: how much
   of the brief has been written, how many step numbers have inked in, and how
   far the path has drawn. All three read the same progress value, so they can
   never disagree with each other.

   Progress is measured against the section, not against element visibility: on a wide screen the four steps enter the viewport together, so watching
   them individually would fire everything at once and there would be no
   transformation to see.
   ------------------------------------------------------ */

const STAGES = 4;

/* Progress runs from the moment the section is three-quarters of the way up
   the viewport to the moment its foot clears the lower third, so the travel
   is the section's height PLUS part of a screen, not the height minus one.
   Measured against the section's own box, the four stages used to be spent by
   the halfway point. */
function practiceProgress() {
  const rect = practiceSection.getBoundingClientRect();
  const travel = rect.height + innerHeight * .4;
  if (travel <= 0) return 0;
  return Math.min(Math.max((innerHeight * .75 - rect.top) / travel, 0), 1);
}

/* ------------------------------------------------------
   FIGURE 1 / CONTEXT ASSEMBLED
   Built from the brief in the markup rather than from a copy of it, so the
   figure cannot drift from the sentence it is counting. One cell per token,
   grouped by the role the clause plays, plus headroom so the window reads as
   filling rather than as full.

   Tokens are split the way a tokenizer does it - punctuation counts, because
   punctuation costs - not by whitespace, which would undercount every clause.
   ------------------------------------------------------ */

const CW_ROLES = ["task", "scope", "evidence", "policy", "ownership"];
const CW_LABELS = {
  task: "Task",
  scope: "Scope",
  evidence: "Evidence",
  policy: "Policy",
  ownership: "Ownership"
};

const cwField = document.getElementById("cw-field");
const cwLegend = document.getElementById("cw-legend");
const cwCount = document.getElementById("cw-count");
const cwRoles = document.getElementById("cw-roles");
let cwCells = [];
let cwTotals = [];

function tokenize(text) {
  return text.match(/[A-Za-z0-9']+|[^\sA-Za-z0-9]/g) || [];
}

(function buildContextWindow() {
  const line = document.querySelector(".brief-line");
  if (!cwField || !line) return;

  /* Stage -1 is the bare task the brief opens with; 0-3 are the clauses it
     gains. Reading them out of the DOM keeps one source of truth. */
  const groups = [...line.children].map(node => ({
    stage: node.dataset.stage === undefined ? -1 : Number(node.dataset.stage),
    text: node.textContent
  })).sort((a, b) => a.stage - b.stage);

  const cells = [];
  groups.forEach(group => {
    const role = CW_ROLES[group.stage + 1];
    if (!role) return;
    const count = tokenize(group.text).length;
    cwTotals[group.stage + 1] = count;
    for (let i = 0; i < count; i++) cells.push({ stage: group.stage, role: role, i: i });
  });

  const frag = document.createDocumentFragment();
  cells.forEach(cell => {
    const node = document.createElement("span");
    node.className = "cw-cell";
    node.dataset.role = cell.role;
    node.dataset.stage = String(cell.stage);
    node.style.setProperty("--i", String(cell.i));
    frag.append(node);
    cwCells.push(node);
  });

  /* Headroom. A context window that is exactly full at the end of the brief
     would be claiming something about a budget nobody stated. */
  const spare = Math.ceil(cells.length * .42);
  for (let i = 0; i < spare; i++) {
    const node = document.createElement("span");
    node.className = "cw-cell";
    node.dataset.stage = "99";
    frag.append(node);
  }
  cwField.append(frag);

  if (cwLegend) {
    CW_ROLES.forEach((role, i) => {
      const key = document.createElement("span");
      key.className = "cw-key";
      key.dataset.role = role;
      key.dataset.stage = String(i - 1);
      key.textContent = CW_LABELS[role];
      cwLegend.append(key);
    });
  }
})();

function updateContextWindow(stage) {
  if (!cwCells.length) return;
  let shown = 0;
  cwCells.forEach(node => {
    const on = Number(node.dataset.stage) <= stage;
    node.classList.toggle("on", on);
    if (on) shown++;
  });
  cwLegend && [...cwLegend.children].forEach(key => {
    key.classList.toggle("on", Number(key.dataset.stage) <= stage);
  });
  if (cwCount) cwCount.textContent = String(shown);
  if (cwRoles) cwRoles.textContent = String(stage + 2);
}

function updatePractice() {
  if (!practiceSection) return;
  const progress = practiceProgress();
  const stage = Math.min(STAGES - 1, Math.floor(progress * STAGES));

  updateContextWindow(stage);

  briefParts.forEach(part => {
    part.classList.toggle("on", Number(part.dataset.stage) <= stage);
  });
  if (briefCount) briefCount.textContent = "0" + (stage + 1) + " / 0" + STAGES;
  deliverySteps.forEach((step, i) => {
    step.classList.toggle("reached", i <= stage);
  });
  if (deliveryPath) {
    /* The last number inks when progress reaches the final stage, so the line
       finishes there too, not at the end of the section. */
    const last = (STAGES - 1) / STAGES;
    const t = Math.min(progress / last, 1) * (segmentStops.length - 1);
    const i = Math.min(segmentStops.length - 2, Math.floor(t));
    const drawn = segmentStops[i] + (segmentStops[i + 1] - segmentStops[i]) * (t - i);
    deliveryPath.setAttribute(
      "stroke-dashoffset",
      reducedMotion.matches ? 0 : deliveryLength * (1 - drawn)
    );
  }
}

/* Staged only once JavaScript is here to stage it: otherwise every clause of
   the brief, and every service row, is simply present. */
if (briefBlock && !reducedMotion.matches) briefBlock.classList.add("staged");
if (!reducedMotion.matches) {
  const menu = document.querySelector(".service-menu");
  if (menu && "IntersectionObserver" in window) menu.classList.add("staged");
}

/* ======================================================
   SCROLL: entrances, delivery emphasis, chapter navigation
   ====================================================== */

if ("IntersectionObserver" in window) {
  const entranceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        entranceObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .2 });

  document.querySelectorAll(".reveal, .service-choice").forEach(element => {
    entranceObserver.observe(element);
  });
} else {
  document.querySelectorAll(".delivery-step").forEach(element => {
    element.classList.add("reached");
  });
  briefParts.forEach(part => part.classList.add("on"));
}

const chapters = [...document.querySelectorAll(".chapter")];
const chapterLinks = [...document.querySelectorAll(".chapter-index a")];
const chapterIndex = document.querySelector(".chapter-index");
let scrollScheduled = false;

function updateChapter() {
  let active = chapters[0].id;

  chapters.forEach(chapter => {
    if (chapter.getBoundingClientRect().top <= innerHeight * .45) {
      active = chapter.id;
    }
  });

  chapterIndex.classList.toggle("on-orange", active === "engagements");

  chapterLinks.forEach(link => {
    const current = link.getAttribute("href") === `#${active}`;
    link.classList.toggle("active", current);
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });

  updatePractice();
  updateLoop();
  moveSectors();
  scrollScheduled = false;
}

function requestChapterUpdate() {
  if (!scrollScheduled) {
    scrollScheduled = true;
    requestAnimationFrame(updateChapter);
  }
}

/* The sector band, moved by the scroll. Half the track is a duplicate of the
   first half, so wrapping at the halfway mark loops without a visible seam. */
const sectorsTrack = document.getElementById("sectors-track");

function moveSectors() {
  if (!sectorsTrack || reducedMotion.matches) return;
  const half = sectorsTrack.scrollWidth / 2;
  if (!half) return;
  const shift = (scrollY * 0.85) % half;
  sectorsTrack.style.transform = "translateX(" + (-shift).toFixed(1) + "px)";
}

/* ======================================================
   FIGURE 2 / THE LOOP
   Measured from the three engagement numerals the same way the delivery path
   is measured from its step numbers, so it cannot drift out of register with
   the rows it belongs to.

   The forward run is a straight rule down through the three marks. The return
   is one cubic bowing out into the page gutter - which is empty, so the line
   never crosses a word - carrying the only label in the figure. A closed
   circuit rather than an arrow, because the claim is that the work re-enters,
   not that it points somewhere.
   ====================================================== */

const loopHost = document.getElementById("loop-host");
const loopSvg = document.getElementById("engagement-loop");
const engagementsSection = document.getElementById("engagements");
let loopRule = null;
let loopLength = 0;

function drawEngagementLoop() {
  if (!loopHost || !loopSvg) return;
  loopRule = null;
  if (getComputedStyle(loopSvg).display === "none") return;

  const host = loopHost.getBoundingClientRect();
  if (!host.width || !host.height) return;

  while (loopSvg.firstChild) loopSvg.removeChild(loopSvg.firstChild);
  loopSvg.setAttribute("viewBox", "0 0 " + host.width + " " + host.height);

  const marks = [...loopHost.querySelectorAll(".engagement-line > .mono")];
  if (marks.length < 2) return;

  const points = marks.map(mark => {
    const box = mark.getBoundingClientRect();
    return {
      x: box.left - host.left + box.width / 2,
      y: box.top - host.top + box.height / 2
    };
  });

  const first = points[0];
  const last = points[points.length - 1];
  /* Into the gutter, but never further than the gutter actually is. */
  const gutter = (innerWidth - host.width) / 2;
  const bowX = -Math.min(46, Math.max(18, gutter - 16));

  let d = "M" + first.x + " " + first.y;
  points.slice(1).forEach(point => { d += " L" + point.x + " " + point.y; });
  d += " C" + bowX + " " + last.y + " " + bowX + " " + first.y + " " + first.x + " " + first.y;

  points.forEach(point => {
    add(loopSvg, "circle", { cx: point.x, cy: point.y, r: 3.5, class: "loop-dot" });
  });

  loopRule = add(loopSvg, "path", { d: d, class: "loop-rule" });
  loopLength = loopRule.getTotalLength();
  loopRule.setAttribute("stroke-dasharray", loopLength);

  const midY = (first.y + last.y) / 2;
  const label = add(loopSvg, "text", {
    class: "loop-label",
    x: bowX + 12,
    y: midY,
    "text-anchor": "middle",
    transform: "rotate(-90 " + (bowX + 12) + " " + midY + ")"
  });
  label.textContent = "Context carried forward";

  updateLoop();
}

/* Runs from the section reaching three-quarters up the viewport to its foot
   clearing the lower third - the same shape as practiceProgress, so the two
   figures are paced alike. */
function loopProgress() {
  if (!engagementsSection) return 0;
  const rect = engagementsSection.getBoundingClientRect();
  const travel = rect.height + innerHeight * .35;
  if (travel <= 0) return 0;
  return Math.min(Math.max((innerHeight * .8 - rect.top) / travel, 0), 1);
}

function updateLoop() {
  if (!loopRule) return;
  /* The circuit closes a little before the section runs out, so the join is
     something you see happen rather than something you scroll past. */
  const drawn = reducedMotion.matches ? 1 : Math.min(loopProgress() / .82, 1);
  loopRule.setAttribute("stroke-dashoffset", loopLength * (1 - drawn));
}

addEventListener("scroll", requestChapterUpdate, { passive: true });
addEventListener("resize", requestChapterUpdate);
addEventListener("resize", drawDeliveryLine);
addEventListener("resize", drawEngagementLoop);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEngagementLoop);
if ("ResizeObserver" in window && loopHost) new ResizeObserver(drawEngagementLoop).observe(loopHost);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDeliveryLine);
/* The path is measured from live geometry, so it cannot be drawn while the
   section has no width, a background tab, a collapsed pane, a late layout.
   A resize observer redraws it the moment the element actually gets a size,
   instead of leaving the path missing until the window happens to resize. */
if ("ResizeObserver" in window) new ResizeObserver(drawDeliveryLine).observe(pathHost);
updateChapter();
drawDeliveryLine();
drawEngagementLoop();
