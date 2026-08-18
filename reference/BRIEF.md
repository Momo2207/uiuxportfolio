# Reference study — flyhyer.com → Parvalle

Standing brief for the "use Hyer as a style reference" piece of work, so it
survives a session restart.

## Status

**Phase 1 (analyse) is blocked.** `flyhyer.com` cannot be reached from the
Claude Code environment:

```
curl     → CONNECT tunnel failed, 403 Forbidden
WebFetch → EGRESS_BLOCKED: blocked by the network egress proxy
```

The proxy README is explicit that organisation egress denials must be reported,
not routed around. Nothing was analysed from second-hand descriptions.

**Unblock:** add `flyhyer.com` (and `www.flyhyer.com`) to the environment's
network egress allowlist — Claude Code → environment settings → network access.
The policy is applied when the container starts, so a **new session** is
needed after the change. Docs: https://code.claude.com/docs/en/claude-code-on-the-web

Retried 2026-08-18 07:08 and 07:09 UTC at the user's request; still denied.

A **fresh session in a fresh container** was spawned 07:28 UTC in the same
`Standard` environment (`env_01PLpPisaZjNg9HzVdNsymqb`) purely to test whether a
new container would pick up a changed policy. It reported:

> `flyhyer.com blocked by egress policy (403 CONNECT)`
> needs_action: `allow www.flyhyer.com in egress policy or confirm alternate host`

That rules out the stale-container theory: restarting does **not** help, because
the environment's own policy still denies the host. Only changing the
environment's network access setting will. There is exactly one environment on
this account, so there is no alternative environment to fall back to.
Note the gateway answers 403 to CONNECT both for a host that is off the
allowlist and for one that is simply unreachable — its own detail reads
"policy denial or upstream failure" — so a refusal alone does not prove which.
Confirm the URL loads in a normal browser before assuming it is the allowlist.

Verify with: `curl -sL -o /dev/null -w "%{http_code}\n" https://www.flyhyer.com/`
(200 = unblocked, 000 = still denied).

## Agreed scope (decided 2026-08-18)

**Take: structure and motion only.**

- Layout mechanics, grid discipline, section composition
- Scroll choreography and animation craft
- Component patterns
- Mobile composition and navigation behaviour

**Do not take: the visual identity.**

Hyer is a dark luxury private-aviation brand. Parvalle's approved brief forbids
luxury posturing and fixes the palette. These stay exactly as they are:

- Papier `#F5F3EE` · Tiefenschwarz `#14272B` · Teal `#2F5C5A` · Salbei
  `#90A89B` · Amber `#C98B38` · Lemon `#E9E77A` · Rot `#B65A52`
- Newsreader (display) + Archivo (UI), self-hosted
- The editorial, understated German voice
- Everything in the anti-pattern list in DESIGN.md

Any proposed change that touches the palette, the typefaces or the positioning
is out of scope and needs a separate decision.

## Non-negotiables for the rebuild

Whatever comes out of the study, the site must still measure:

- 0 horizontal overflow, 320 → 1728px
- 0 WCAG contrast failures (browser-composited, not static analysis)
- CLS 0, no console errors, no broken links
- Full content readable with JavaScript disabled
- 200% page zoom and 200% text-only zoom without horizontal scrolling
- `prefers-reduced-motion` preserves state feedback rather than killing all motion

Motion added from the reference must degrade to a still, readable page.

## How to run phase 1 once unblocked

```bash
node tools/analyze-reference.mjs https://www.flyhyer.com/ --name hyer
node tools/analyze-reference.mjs https://www.flyhyer.com/solutions --name hyer-solutions
```

Writes to `reference/<name>/`: viewport screenshots at 320/375/430/768/1024/
1280/1440/1728, full-page captures at 1440 and 390, and `report.json` with
measured type/colour/spacing/surface tokens, a section and component inventory,
and a motion inventory (keyframes, animation libraries, scroll-driven CSS,
reduced-motion handling).

## Parvalle baseline (measured 2026-08-18)

For the side-by-side diff. Same tool, same format:

| | Parvalle today |
|---|---|
| Body | Archivo on `rgb(245,243,238)` |
| Faces | Archivo (71 uses), Newsreader (33) |
| Type sizes | 12 · 15 · 18.8 · 29.6 · 32 · 34.4 · 54.4 · 96px |
| Grounds | Papier, Ink `rgb(20,39,43)`, Teal `rgb(47,92,90)` |
| Border radius | none anywhere |
| Motion | 0 libraries, 0 keyframes, one scroll-linked rail; reduced-motion handled |
| Homepage | 17 sections, 20 headings |

The most likely gaps a reference study will expose: motion vocabulary (Parvalle
has exactly one authored moment), section transitions, and mobile composition
beyond stacking.
