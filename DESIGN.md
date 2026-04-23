# Design System Specification: Modern Wellness & The Radiant Organic

## 1. Overview & Creative North Star: "The Solar Pulse"
This design system moves away from the clinical, rigid grids of traditional wellness apps. Our Creative North Star is **"The Solar Pulse"**—an editorial approach to UI that mimics the natural growth, warmth, and asymmetry of a sunflower.

To achieve a "High-End Editorial" feel, we reject the "template" look. Instead of placing content in static boxes, we use **intentional asymmetry** and **overlapping layers**. Elements should feel like petals falling on a soft surface—interconnected, organic, and breathing. We use massive typography scales to create a sense of confidence, balanced by vast amounts of negative space (using our `16` and `20` spacing tokens) to reduce cognitive load for students.

---

## 2. Colors & Tonal Depth
Our palette is rooted in the earth but lifted by the sun. We use a sophisticated Material 3-inspired tonal system to ensure harmony.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To define boundaries, designers must use background color shifts. For example, a `surface-container-low` component should sit on a `surface` background. If you feel the need for a line, increase the padding instead.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked handmade paper.
*   **Base:** `surface` (#fff8f6)
*   **Secondary Area:** `surface-container-low` (#fff1ed)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) for maximum "pop" and cleanliness.
*   **Active/Hero Elements:** `primary-container` (#f6c945)

### The "Glass & Gradient" Rule
To avoid a flat, "cheap" digital look, use **Glassmorphism** for floating navigation bars or modal overlays. 
*   **Specs:** `surface` color at 70% opacity with a `20px` backdrop-blur. 
*   **Signature Texture:** Use a subtle linear gradient (Top-Left: `primary` to Bottom-Right: `primary-container`) for high-impact CTAs to provide a "golden hour" glow.

---

## 3. Typography: Editorial Authority
We pair the high-character **Plus Jakarta Sans** for expression with the functional clarity of **Inter**.

*   **Display (Plus Jakarta Sans):** Used for mood-setting headers and daily affirmations. The `display-lg` (3.5rem) should be used sparingly to create an "Editorial Cover" feel.
*   **Headlines (Plus Jakarta Sans):** These are the "voice" of the app. Use `headline-md` for screen titles to convey warmth.
*   **Body & Labels (Inter):** All functional text uses Inter. It provides a grounded, stable contrast to the expressive headers.

**Hierarchy Note:** Always maintain a minimum 2:1 size ratio between headlines and body text to ensure a signature high-contrast look.

---

## 4. Elevation & Depth: Tonal Layering
We do not use elevation to "lift" objects; we use it to "place" them in an environment.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container` background. The contrast in "warmth" creates the shadow-less lift.
*   **Ambient Shadows:** For floating action buttons or primary modals, use a "Sun-Cast" shadow: 
    *   `X: 0, Y: 12, Blur: 32, Spread: -4`.
    *   **Color:** `#5D4037` at **6% opacity**. This mimics natural light rather than digital mud.
*   **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-contrast modes), use the `outline-variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons: The "Petal" Shape
*   **Primary:** `primary-container` background with `on-primary-container` text. 
*   **Shape:** Use the `xl` (3rem) corner radius to create a pill-like, organic feel.
*   **Secondary:** `secondary-container` background. No border.

### Cards: The Organic Container
*   **Design Rule:** Forbid divider lines. Use `spacing-6` (2rem) to separate content blocks.
*   **Accent:** Every third card should feature a "Petal Accent"—a decorative, oversized `secondary-fixed-dim` (#b0cfad) organic shape peeking from behind the card corner at 20% opacity.

### Input Fields: Soft Focus
*   **Style:** `surface-container-highest` background. No border.
*   **Focus State:** Transition to `primary-fixed` background with a subtle 2px "Ghost Border" of the `primary` token.

### Additional Signature Components
*   **Wellness "Sun" Progress:** A circular progress tracker using the `primary` yellow, featuring a slight outer glow (blur) to simulate radiance.
*   **The "Breathe" Overlay:** A full-screen `tertiary-container` (#c1d0db) glassmorphism sheet for meditative moments.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins. A card can be offset from the center to create a more "editorial" layout.
*   **Do** use the `Warm Brown` (#5D4037) for all text. Pure black (#000000) is forbidden as it breaks the organic warmth.
*   **Do** lean into the `lg` (2rem) and `xl` (3rem) corner radii for almost everything.

### Don't
*   **Don't** use 1px dividers. If you need separation, use a `surface-variant` background block or more white space.
*   **Don't** use standard "drop shadows." If it looks like a default Photoshop shadow, it’s too dark.
*   **Don't** crowd the screen. If a student feels "busy" looking at the UI, the wellness mission has failed. Use the `24` spacing token (8.5rem) for top-of-page breathing room.