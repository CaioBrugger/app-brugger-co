---
name: 21stdev-components
description: Find, evaluate, and integrate production-ready UI components from 21st.dev. Use when building complex animated UI widgets, interactive components, or polished marketing blocks. Triggers on: component library, 21st.dev, animated component, UI block, premium component, button animado, card animado, hero section.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch
---

# 21st.dev Component Integration

> **21st.dev** is a curated marketplace of production-ready React components with premium animations, built by the community.
> Use it when a component has real visual complexity — and avoid it when a simple custom implementation is faster.

---

## When to Use 21st.dev

**✅ Use when:**
- Need complex animations (scroll reveals, spring physics, magnetic hover, shimmer effects)
- Building marketing blocks (heroes, testimonials, pricing sections, CTAs)
- Need polished interactive patterns (carousels, animated tabs, morphing buttons, glowing cards)
- Building something that would take 30+ minutes to get right from scratch

**❌ Skip when:**
- Component is a simple button, input, or label with no animation
- The project already has a similar component — extend it instead
- Component dependencies (Framer Motion, GSAP) add significant bundle weight with little gain

---

## Component Categories Reference

| Category | URL Slug | What's there |
|----------|----------|-------------|
| Buttons | `/s/button` | Shimmer, magnetic, glitch, morphing, liquid |
| Cards | `/s/card` | Glow, flip, 3D tilt, spotlight |
| Heroes | `/s/hero` | Animated text, particle, video, split |
| Testimonials | `/s/testimonial` | Marquee, carousel, stacked |
| Features | `/s/features` | Icon grid, animated bento, reveal |
| CTAs | `/s/cta` | Gradient, animated border, countdown |
| Modals | `/s/modal` | Drawer, sheet, lightbox, dialog |
| Navigation | `/s/navigation` | Animated navbar, dock, breadcrumb |
| Inputs | `/s/input` | Floating label, OTP, search animated |
| Tabs | `/s/tabs` | Pill, sliding underline, animated |
| Badges | `/s/badge` | Animated, gradient, pulsing dot |
| Loaders | `/s/loader` | Spinner, skeleton, progress bar |

Full catalog: `https://21st.dev/community/components`

---

## Workflow: Finding and Using a Component

### Step 1 — Search (Primary Method: WebSearch)

21st.dev is a Next.js SPA and category list pages don't render via WebFetch.
**Use WebSearch to find specific components:**

```
WebSearch: site:21st.dev [describe what you need]
```

Examples:
- `site:21st.dev animated shimmer button react`
- `site:21st.dev testimonial marquee carousel`
- `site:21st.dev hero section animated text gradient`
- `site:21st.dev magnetic hover card glow`

Identify the best result URL. Individual component pages follow this pattern:
```
https://21st.dev/[author]/[component-slug]
```

---

### Step 2 — Fetch the Component Page

```
WebFetch: https://21st.dev/[author]/[component-slug]
```

Ask: "Extract the complete React component code including all imports, the component function body, and CSS/styles. List all required npm dependencies."

---

### Step 3 — Fallback: GitHub Raw Source

If the component page returns minified/incomplete code, look for the GitHub link on the page.
Most 21st.dev authors publish their components publicly. Use:

```
WebSearch: site:github.com [author] [component-slug] 21stdev tsx
```

Then fetch the raw file directly:
```
WebFetch: https://raw.githubusercontent.com/[author]/[repo]/main/[path].tsx
```

---

### Step 4 — Evaluate Before Adapting

Before writing any code, answer:

| Question | If YES → |
|----------|---------|
| Uses Framer Motion? | Check if pure CSS can replace it. If not, estimate bundle impact. |
| Uses shadcn/Radix primitives? | Replace with native HTML equivalents. |
| Uses Tailwind? | Convert to inline styles (see rules below). |
| Has complex TypeScript generics? | Simplify to plain JS for this project. |
| Requires context/state from a provider? | Inline the state locally. |

---

## Stack Adaptation Rules (CRITICAL)

This project uses **inline React styles only** — no Tailwind, no CSS modules, no component libraries.
When a 21st.dev component uses Tailwind, convert every class.

### Tailwind Utility → Inline Style

| Tailwind class | Inline style value |
|----------------|-------------------|
| `flex items-center justify-between` | `display:'flex', alignItems:'center', justifyContent:'space-between'` |
| `gap-4` | `gap:'1rem'` |
| `p-6` | `padding:'1.5rem'` |
| `px-4 py-2` | `padding:'0.5rem 1rem'` |
| `text-lg font-bold` | `fontSize:'1.125rem', fontWeight:700` |
| `text-sm text-white/60` | `fontSize:'0.875rem', color:'rgba(255,255,255,0.6)'` |
| `bg-black rounded-xl` | `background:'#000', borderRadius:'12px'` |
| `border border-white/10` | `border:'1px solid rgba(255,255,255,0.1)'` |
| `max-w-4xl mx-auto` | `maxWidth:'56rem', margin:'0 auto'` |
| `grid grid-cols-3 gap-6` | `display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem'` |
| `absolute inset-0` | `position:'absolute', inset:0` |
| `transition-all duration-300 ease-out` | `transition:'all 0.3s ease-out'` |
| `opacity-0 group-hover:opacity-100` | Use `onMouseEnter/onMouseLeave` state |
| `hover:scale-105` | Use `onMouseEnter/onMouseLeave` with `transform:'scale(1.05)'` |
| `z-10` | `zIndex:10` |
| `overflow-hidden` | `overflow:'hidden'` |
| `w-full h-full` | `width:'100%', height:'100%'` |
| `pointer-events-none` | `pointerEvents:'none'` |

### Hover and Pseudo-class Handling

React inline styles don't support `:hover`. Two options:

**Option A — State (for single elements):**
```jsx
const [hovered, setHovered] = React.useState(false);
<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{
    transform: hovered ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.2s ease'
  }}
/>
```

**Option B — `<style>` tag (for complex/repeated hover effects):**
```jsx
<>
  <style>{`
    .my-card:hover { transform: scale(1.05); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .my-card:hover .my-card-overlay { opacity: 1; }
  `}</style>
  <div className="my-card" style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}>
    <div className="my-card-overlay" style={{ opacity: 0, transition: 'opacity 0.25s ease' }} />
  </div>
</>
```

> Use Option A for 1-2 properties. Use Option B when multiple child elements react to the same hover.

### Animation Keyframes

Never use Tailwind's `animate-*` classes. Convert to CSS `@keyframes`:

```jsx
// ❌ DON'T: className="animate-pulse"
// ✅ DO:
<>
  <style>{`
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .pulsing { animation: pulse 2s ease-in-out infinite; }
  `}</style>
  <div className="pulsing" style={{ ... }} />
</>
```

Use the project's existing animation class names when they already exist:
- `lp-animate` — scroll-triggered fade in
- `lp-fade-left` / `lp-fade-right` — directional reveals
- `lp-card-glow` — card glow on hover
- `lp-cta-shimmer` — shimmer effect on CTAs

### Framer Motion Handling

**If the animation can be done in pure CSS** (fades, slides, scales, pulses):
→ **Rewrite in CSS.** Framer Motion adds ~40kb to the bundle.

**If the animation is truly Framer Motion–only** (drag, shared layout, spring physics, presence animations):
→ Install it: `cd "C:/Users/caiob/AppData/Local/brugger-co" && npm install framer-motion`
→ Add to Vite config: open `C:/Users/caiob/AppData/Local/brugger-co-config/vite.config.js`
  and add `'framer-motion'` to `optimizeDeps.include`

### shadcn/Radix/HeadlessUI Handling

If the component imports from `@/components/ui/button`, `@radix-ui/...`, or `@headlessui/...`:
- **DO NOT install these libraries** — they pull in large dependency trees
- Replace with native HTML + inline styles:
  - `<Button>` → `<button>`
  - `<Dialog>` / `<Modal>` → `<div style={{ position:'fixed', ... }}>`
  - `<Tooltip>` → custom div with CSS `:hover` via `<style>` tag
  - Keep the logic, replace the primitives

### Utility Functions (cn, clsx, cva)

These merge class names. Since we use inline styles, remove them entirely:
```jsx
// ❌ REMOVE:
import { cn } from "@/lib/utils"
className={cn("base-class", condition && "extra-class")}

// ✅ REPLACE WITH:
style={{ ...baseStyles, ...(condition ? extraStyles : {}) }}
```

---

## Project Stack Quick Reference

| Property | Value |
|----------|-------|
| Framework | React 18 + Vite 6 |
| Styling | Inline `style={{}}` only |
| Animations | Pure CSS `@keyframes` + `transition` |
| Fonts | DM Sans + DM Serif Display (Google Fonts, already loaded) |
| Color tokens | `var(--bg)`, `var(--surface)`, `var(--accent)` (#C9A962 gold), `var(--border)`, `var(--text)`, `var(--text-muted)` |
| Border radius | `var(--radius-md)`, `var(--radius-lg)` |
| No libraries | No Tailwind, shadcn, Radix, Material UI |
| npm path | `C:/Users/caiob/AppData/Local/brugger-co` |

---

## Integration Steps

1. **Create** the component file at `design-generator/src/components/[ComponentName].jsx`
2. **Paste** the code from 21st.dev, completely adapted (no Tailwind, no lib imports)
3. **Replace** colors and tokens with the project's CSS variables (`var(--accent)`, etc.)
4. **Test** that the component renders correctly with `npm run dev` (port 3000)
5. **Import** in the target page/component

---

## Optional: Activate the 21st.dev Magic MCP

21st.dev has an official MCP server ("Magic") that lets AI agents search and generate components directly.
If you want to enable it, add to `~/.claude.json` under `mcpServers`:

```json
"21st-dev-magic": {
  "command": "npx",
  "args": ["-y", "@21st-dev/magic@latest"],
  "env": {
    "API_KEY": "YOUR_21STDEV_API_KEY"
  }
}
```

Get the API key at: `https://21st.dev/magic` (free tier available).

When the MCP is active, use the tool `mcp__21st-dev-magic__search_components` to search
and `mcp__21st-dev-magic__get_component` to retrieve code — no WebSearch/WebFetch needed.
