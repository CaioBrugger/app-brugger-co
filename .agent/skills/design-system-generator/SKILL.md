---
name: Design System Generator
description: Extracts the visual identity (tokens, colors, typography, components) from a given website or HTML/CSS file, and generates a complete, visual, interactive Design System documentation page exactly like the reference template.
---

# Design System Generator

When the USER invokes this skill and provides the files (HTML, CSS) or URL of a website, your goal is to generate a complete visual **Design System documentation page**. This page should reflect the branding, colors, typography, and components of the provided site, but strictly follow the visual layout and structure of the `template.html` provided in this skill folder.

## Objective
Create a new `design-system-[nome].html` file containing the personalized design system based on the provided website, displaying it with the premium design of the reference template.

## Execution Steps

### 1. Extract Identity
Analyze the site provided by the USER (using `read_url_content`, `view_file`, or running a browser subagent/script). Identify the Design Tokens:
- **Brand Name / Logo text**
- **Colors:** Backgrounds (base, surface 1/2/3), Texts (main, muted), Accents (primary, hover, dark), Status (success, error, info), Borders.
- **Typography:** Font families (e.g., Inter, Roboto), weights (400, 500, 700, etc.), and scale (base size, headings, etc.). Include a Google Fonts link if applicable.
- **Spacing:** Base unit (e.g., 4px or 8px) and scaling.
- **Border Radius:** Default rounding for cards, buttons, badges.
- **Shadows:** Depths, glows, and box-shadows.

### 2. Read the Template
Use `view_file` to read the `template.html` located in `.agents/skills/design-system-generator/template.html`. Pay close attention to:
- The `<style>` block: `root` CSS variables, layout, grid CSS, etc.
- The structure of the page: Top Nav, Hero Section, Sidebar.
- The documentation sections:
  - `01 — CORES`
  - `02 — TIPOGRAFIA`
  - `03 — ESPAÇAMENTO`
  - `04 — BORDER RADIUS`
  - `05 — SOMBRAS`
  - `06 — COMPONENTES`
  - `TOKENS COMPLETO` (CSS variables block at the end).

### 3. Generate the Custom Design System
Create a new HTML file (e.g., `design-system-[site-name].html`) based heavily on the `template.html`. 
You must **REPLACE** the properties in the template to match the user's extracted site properties:
- Replace all specific hardcoded hex colors, RGBs, and color names inside the `<style>` and HTML tags to match the new site's palette.
- Replace the Google Fonts URL and update `--font` definitions. Update the typography showcase lines to reflect the new font.
- Update the components (buttons, badges) inside the HTML to use the extracted site's border-radiuses, shadows, sizes, and padding.
- Change textual references ("ORDEM", "AXION", etc.) to the name of the new site. Update the Hero title and subtext.
- In the "TOKENS COMPLETO" section, dump the fully updated CSS `:root` variables.

### 4. Output the Result
Use the `write_to_file` tool to save your fully populated HTML file into the directory the user requests (or the current directory by default). Provide the USER a file link to open their shiny new design system!

## Important Notes:
- Keep the dark, futuristic aesthetic of the template if it fits. If the extracted site is fully light-mode, you *must* adapt the backgrounds and text colors within the template variables to be visually clear and pleasing.
- The interactive features of the template (toast copy notifications, sidebar scrollspy) must remain intact. DO NOT accidentally strip the JavaScript at the bottom of the template.
- Ensure to output a single, complete, copy-pasteable HTML file that the user can open locally.
