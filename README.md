# vibencode.com

The Vibencode site. Plain static HTML, CSS and JavaScript — no build step, no
framework, no package manager, no toolchain. What is in this repository is
exactly what gets served.

## Running it locally

Any static file server works, from the repository root. Two that need nothing
installed beyond what you probably already have:

```bash
npx --yes serve -l 8010
```

```bash
python -m http.server 8010
```

Then open <http://localhost:8010>. It has to be served over HTTP rather than
opened as a `file://` path — every internal link is absolute (`/assets/site.css`,
`/services/sovereign-ai/`), so the site expects to sit at a domain root.

That same fact is why this repository is named `prateekcom.github.io`: a GitHub
Pages **user site** publishes at the root, where those links resolve. A normal
project repository would publish under `/<repo>/` and every link would 404.

## Structure

```
index.html                    the home page — five acts, cursor-driven token stream
hero-archive.html             thirteen earlier hero concepts, kept for reference
about/  work/  contact/  careers/
services/                     index, plus one page per service
assets/
  site.css                    the whole design system
  data.js                     the six services — single source of truth
  home.js                     home page only
  site.js                     the cursor stream
  pages.js                    inner pages: reading bar, contents rail, drawn tracks
logo.png
.nojekyll                     serve the files as they are; do not run Jekyll
```

`assets/data.js` is the one place the six services are written down. The home
page cycles them, the services index renders its rows from them, and the token
stream draws its words from them — so the wording cannot drift between the
three.

## Design notes

Two typefaces do the identifying: **Bricolage Grotesque** asks, **IBM Plex Mono**
answers. The motif is language rather than illustration — each service is a pair
of sentences, what a client actually says and what it becomes.

Everything that moves is a response to scrolling; nothing runs on a timer. Every
staged or dimmed state is added by script and fails open, so a page with
JavaScript disabled, or with `prefers-reduced-motion` set, is the finished page
with nothing moving rather than a broken one.

## Still to come

- `/work/` is a template. Nine case studies exist in the old WordPress export but
  carry headings with empty bodies, so nothing has been filled in.
- The registered address, contact email and phone are marked `TODO` in the
  footer of every page and need confirming.
- The GenAI use-case library (155 posts) is not here yet.
