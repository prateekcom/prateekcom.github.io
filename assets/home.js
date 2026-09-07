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
   of invented "deliverable sheets". Both failed for the same reason — an
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

  const subject = interest
    ? `Vibencode project enquiry: ${interest}`
    : "An AI initiative for Vibencode";

  document.getElementById("email-link").href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
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
   gets assembled. It stops on hover, on focus, and when scrolled away.
   ====================================================== */

const heroSaid = document.getElementById("hero-said");
const heroBecame = document.getElementById("hero-became");
const heroStage = document.getElementById("hero-stage");
const pairDots = [...document.querySelectorAll("[data-pair]")];
const pairJump = document.getElementById("pair-jump");
const pairKeys = pairDots.map(dot => dot.dataset.pair);

let pairIndex = 0;
let pairTimer = null;
let pairPaused = false;
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

function runPairs() {
  clearInterval(pairTimer);
  pairTimer = null;
  if (reducedMotion.matches || pairPaused || !pairOnScreen) return;
  pairTimer = setInterval(nextPair, 6200);
}

pairDots.forEach(dot => {
  dot.addEventListener("click", () => {
    showPair(pairKeys.indexOf(dot.dataset.pair));
    runPairs();
  });
});

/* Only keyboard focus holds the cycle — someone tabbing through the six needs
   it to stay put. Pointer hover used to pause it too, which meant a cursor
   resting anywhere over the hero stopped it for good and it read as static. */
heroStage.addEventListener("focusin", () => { pairPaused = true; runPairs(); });
heroStage.addEventListener("focusout", () => { pairPaused = false; runPairs(); });

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


/* ------------------------------------------------------
   THE HERO SWITCH
   Two heroes live in the page at once so they can be compared on the real
   thing rather than in screenshots. Both are driven by the same six pairs, so
   whichever wins, nothing else has to change. Remove the loser and this whole
   block goes with it.
   ------------------------------------------------------ */

/* The key carries a number. Bumping it retires every stored choice at once,
   which is what you want when the default changes: anyone who looked at this
   before has "a" saved, and without the bump they would keep being shown the
   old default and think nothing had happened. Picking a variant still sticks
   from here on. */
const HERO_KEY = "vibencode-hero-2";
/* Named is the default, and it is set on <body> in the markup too so the
   first painted frame is already correct. Change it in both places. */
const HERO_DEFAULT = "named";
/* Every variant renders the same markup; what changes is the section-level
   treatment keyed off body[data-hero]. Nothing here duplicates content, so a
   copy change lands in all five at once. */
const HEROES = {
  a: "The original",
  named: "Named",
  becomes: "Becomes"
};

const heroButtons = [...document.querySelectorAll("button[data-hero]")];
const switchName = document.getElementById("switch-name");

/* The switch is review apparatus and stays hidden unless it is asked for.
   Visit /?proto to compare the concepts; every other visitor gets the site
   with no controls on it. The hero itself is unaffected either way.

   Declared above applyHero on purpose: applyHero reads it, and a const read
   before its declaration has run throws rather than returning undefined. */
const heroSwitch = document.getElementById("hero-switch");
const proto = new URLSearchParams(location.search).has("proto");
if (proto) heroSwitch.hidden = false;

function applyHero(which) {
  if (!HEROES[which]) which = HERO_DEFAULT;
  document.body.dataset.hero = which;
  heroButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.hero === which));
  });
  switchName.textContent = HEROES[which];
  /* Read and written only while reviewing. An ordinary visit neither restores
     a reviewer's choice nor overwrites it - without the second half, walking
     through the live site between two reviews silently reset the switch. */
  if (proto) {
    try { localStorage.setItem(HERO_KEY, which); } catch (error) { /* private mode */ }
  }
  return which;
}

let heroChoice = HERO_DEFAULT;
if (proto) {
  try { heroChoice = localStorage.getItem(HERO_KEY) || HERO_DEFAULT; } catch (error) { /* private mode */ }
}
heroChoice = applyHero(heroChoice);

heroButtons.forEach(button => {
  button.addEventListener("click", () => {
    heroChoice = applyHero(button.dataset.hero);
    runPairs();
  });
});

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

  /* Where along the path each step's dot sits. The segments are not equal —
     the staircase makes later ones longer — so drawing the line at a constant
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

   Progress is measured against the section, not against element visibility —
   on a wide screen the four steps enter the viewport together, so watching
   them individually would fire everything at once and there would be no
   transformation to see.
   ------------------------------------------------------ */

const STAGES = 4;

/* Progress runs from the moment the section is three-quarters of the way up
   the viewport to the moment its foot clears the lower third — so the travel
   is the section's height PLUS part of a screen, not the height minus one.
   Measured against the section's own box, the four stages used to be spent by
   the halfway point. */
function practiceProgress() {
  const rect = practiceSection.getBoundingClientRect();
  const travel = rect.height + innerHeight * .4;
  if (travel <= 0) return 0;
  return Math.min(Math.max((innerHeight * .75 - rect.top) / travel, 0), 1);
}

function updatePractice() {
  if (!practiceSection) return;
  const progress = practiceProgress();
  const stage = Math.min(STAGES - 1, Math.floor(progress * STAGES));

  briefParts.forEach(part => {
    part.classList.toggle("on", Number(part.dataset.stage) <= stage);
  });
  if (briefCount) briefCount.textContent = "0" + (stage + 1) + " / 0" + STAGES;
  deliverySteps.forEach((step, i) => {
    step.classList.toggle("reached", i <= stage);
  });
  if (deliveryPath) {
    /* The last number inks when progress reaches the final stage, so the line
       finishes there too — not at the end of the section. */
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

/* Staged only once JavaScript is here to stage it — otherwise every clause of
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

addEventListener("scroll", requestChapterUpdate, { passive: true });
addEventListener("resize", requestChapterUpdate);
addEventListener("resize", drawDeliveryLine);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDeliveryLine);
/* The path is measured from live geometry, so it cannot be drawn while the
   section has no width — a background tab, a collapsed pane, a late layout.
   A resize observer redraws it the moment the element actually gets a size,
   instead of leaving the path missing until the window happens to resize. */
if ("ResizeObserver" in window) new ResizeObserver(drawDeliveryLine).observe(pathHost);
updateChapter();
drawDeliveryLine();


/* ======================================================
   IDENTITY KIT: downloadable applications
   The posters print the same six sentences the site cycles through, read from
   the same object — so a poster can never claim something the site does not.
   There is no artwork in them because the identity has none: it is the pair,
   the two voices, and the four grounds.
   ====================================================== */

const GROTESK = "Bricolage Grotesque, Arial, sans-serif";
const PLEX = "IBM Plex Mono, monospace";

function escapeXML(text) {
  return String(text).replace(/[&<>"]/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

/* SVG text does not wrap, so break on words against a character budget. */
function wrapText(text, max) {
  const lines = [];
  let line = "";
  text.split(" ").forEach(word => {
    if (line && (line + " " + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + " " + word : word;
  });
  if (line) lines.push(line);
  return lines;
}

function lineBlock(text, o) {
  const lines = wrapText(text, o.max);
  const markup = lines.map((line, i) =>
    `<text x="${o.x}" y="${o.y + i * o.lh}" font-family="${o.font}" font-size="${o.size}"` +
    (o.weight ? ` font-weight="${o.weight}"` : "") +
    (o.tracking ? ` letter-spacing="${o.tracking}"` : "") +
    ` fill="${o.fill}">${escapeXML(line)}</text>`).join("");
  return { markup: markup, end: o.y + (lines.length - 1) * o.lh };
}

function pairPoster(key, o) {
  const service = services[key];
  const said = lineBlock("“" + service.said + "”", {
    x: 60, y: 336, lh: 76, max: 25, font: GROTESK, size: 64, weight: 700, tracking: -3, fill: o.ink
  });
  const badgeY = said.end + 56;
  const becameY = badgeY + 168;
  const became = lineBlock(service.became, {
    x: 60, y: becameY, lh: 40, max: 52, font: PLEX, size: 24, fill: o.ink
  });

  return `<svg xmlns="${NS}" width="1080" height="1080" viewBox="0 0 1080 1080"
      role="img" aria-label="Vibencode. ${escapeXML(service.said)}">
      <rect width="1080" height="1080" fill="${o.bg}"/>
      <text x="60" y="82" font-family="${GROTESK}" font-size="34" font-weight="700"
        letter-spacing="-1.4" fill="${o.ink}">vibencode</text>
      <text x="60" y="152" font-family="${PLEX}" font-size="17" letter-spacing="2"
        fill="${o.accent}">${escapeXML(service.code.toUpperCase())}</text>
      <text x="60" y="252" font-family="${GROTESK}" font-size="30" font-weight="700"
        letter-spacing="-1" fill="${o.quiet}">WHAT IF.</text>
      ${said.markup}
      <rect x="60" y="${badgeY - 40}" width="152" height="58" fill="${o.badgeBg}"
        transform="rotate(-4.5 136 ${badgeY - 11})"/>
      <text x="136" y="${badgeY - 2}" text-anchor="middle" font-family="${PLEX}"
        font-size="26" fill="${o.badgeInk}" transform="rotate(-4.5 136 ${badgeY - 11})">meet</text>
      <text x="60" y="${becameY - 62}" font-family="${PLEX}" font-size="30" font-weight="600"
        letter-spacing="-1" fill="${o.quiet}">HOW TO.</text>
      ${became.markup}
      <text x="60" y="1026" font-family="${PLEX}" font-size="16" letter-spacing="2"
        fill="${o.quiet}">VIBENCODE — AI CONSULTING &amp; ENGINEERING</text>
    </svg>`;
}

const socialDesigns = [
  {
    filename: "vibencode-01-implementation.svg",
    label: "01 / GenAI implementation",
    svg: pairPoster("genai", {
      bg: "#dcd2f2", ink: "#24202b", accent: "#a8321a", quiet: "#5c4676",
      badgeBg: "#24202b", badgeInk: "#dcd2f2"
    })
  },
  {
    filename: "vibencode-02-orchestration.svg",
    label: "02 / Agents & orchestration",
    svg: pairPoster("agents", {
      bg: "#24202b", ink: "#dcd2f2", accent: "#f4512e", quiet: "#a79bb8",
      badgeBg: "#dcd2f2", badgeInk: "#24202b"
    })
  },
  {
    filename: "vibencode-04-sovereign.svg",
    label: "04 / Sovereign AI",
    svg: pairPoster("sovereign", {
      bg: "#f4512e", ink: "#24202b", accent: "#24202b", quiet: "#7a2814",
      badgeBg: "#24202b", badgeInk: "#f4512e"
    })
  }
];

function downloadSVG(svg, filename) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const socialGrid = document.getElementById("social-grid");

socialDesigns.forEach(design => {
  const item = document.createElement("div");
  item.className = "social-item";

  const preview = document.createElement("div");
  preview.className = "social-preview";
  // All SVG strings above are fixed local design assets, not user input.
  preview.innerHTML = design.svg;

  const download = document.createElement("button");
  download.className = "download-art";
  download.textContent = `${design.label} — Download SVG ↘`;
  download.addEventListener("click", () => downloadSVG(design.svg, design.filename));

  item.append(preview, download);
  socialGrid.appendChild(item);
});

const identityDialog = document.getElementById("identity-dialog");

document.getElementById("open-identity").addEventListener("click", () => {
  identityDialog.showModal();
});

document.getElementById("close-identity").addEventListener("click", () => {
  identityDialog.close();
});

identityDialog.addEventListener("click", event => {
  if (event.target !== identityDialog) return;
  const rect = identityDialog.getBoundingClientRect();
  if (
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
  ) {
    identityDialog.close();
  }
});
