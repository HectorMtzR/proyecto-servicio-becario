# Design System Specification: Institutional Premium Dashboard

## 1. Overview & Creative North Star
**Creative North Star: "The Academic Curator"**

This design system moves beyond the utility of a standard dashboard to create an editorialized, high-end management experience. It is designed to feel like a premium concierge service rather than a database. To achieve this, we shift away from "boxed-in" web patterns and embrace a layout philosophy driven by **Tonal Architecture**.

Instead of using rigid lines to separate content, we use whitespace as a structural element and background shifts to define zones. The visual identity is anchored by the tension between the energetic **Anáhuac Orange** and the authoritative **Anthracite**, balanced by a "Soft Minimalism" that allows scholarly data to breathe. 

**The Editorial Edge:** We utilize intentional asymmetry in header placements and oversized typography scales to guide the eye, ensuring the dashboard feels custom-built for high-level decision-makers.

---

## 2. Colors & Surface Philosophy
The palette is grounded in institutional heritage but executed with contemporary depth.

### Color Strategy
*   **Primary (#a04100 / #ff6b00):** Reserved for high-intent actions and brand-defining moments. Use `primary_container` for large impactful areas and `primary` for text-based calls to action.
*   **Secondary (#5f5e5e / #1a1a1a):** Provides the "Anthracite" weight. Used for sidebar backgrounds, deep text, and grounding elements.
*   **Tertiary (#0062a1):** Used sparingly for informational status (e.g., "In Progress") to provide a professional counterpoint to the warmth of the orange.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts or tonal transitions.
*   **Surface Hierarchy:** 
    *   Main App Background: `surface` (#f8f9fa).
    *   Sub-sections/Wrappers: `surface_container_low` (#f3f4f5).
    *   Floating Cards: `surface_container_lowest` (#ffffff).
*   **The Glass & Gradient Rule:** For floating navigation or modal headers, use a semi-transparent `surface_container_lowest` with a `backdrop-blur` of 12px. Main CTAs should utilize a subtle linear gradient from `primary` to `primary_container` (135° angle) to add "soul" and avoid a flat, "bootstrap" appearance.

---

## 3. Typography
We utilize a dual-typeface system to balance institutional authority with modern readability.

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels engineered yet approachable.
    *   Use `display-lg` for welcome states and `headline-md` for section titles.
    *   *Editorial Note:* Always use a tighter letter-spacing (-0.02em) for headlines to increase the "premium" feel.
*   **Body & Labels (Inter):** The workhorse for data density.
    *   Use `body-md` for scholarship details and `label-sm` (all caps, +0.05em tracking) for category tags.
*   **Hierarchy as Brand:** High contrast between `headline-lg` (Anthracite) and `body-sm` (Secondary Grey) creates a clear path for the user’s eye, making complex scholarship data feel manageable.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than traditional structural shadows.

*   **The Layering Principle:** Stack surfaces to create focus. A `surface_container_lowest` card sitting on a `surface_container_low` background creates a natural, soft lift.
*   **Ambient Shadows:** When a card requires a "floating" effect (e.g., a hovered scholarship application), use a shadow with a blur of 32px, 0% spread, and 6% opacity using a tinted `on_surface` color. It should feel like a soft glow, not a dark drop shadow.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in high-contrast modes), use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** Use for persistent elements like top-nav bars. Apply `surface_container_lowest` at 80% opacity with a heavy blur to allow background content to "bleed" through softly.

---

## 5. Components

### Cards & Data Containers
*   **Style:** `rounded-xl` (1.5rem), `surface_container_lowest` background.
*   **Rule:** Absolutely no dividers. Use vertical whitespace (refer to the `xl` spacing scale) to separate the header from the content.
*   **Interaction:** On hover, shift the background to `surface_bright` and increase the ambient shadow slightly.

### Buttons
*   **Primary:** `primary_container` background, `on_primary_container` text. Rounded-xl. No border.
*   **Secondary:** `surface_container_high` background. This creates a "soft" button that feels integrated into the UI.
*   **Tertiary:** Text-only with an underline appearing only on hover.

### Scholarship Status Chips
*   **Variants:** Use `tertiary_container` for "Pending" and `error_container` for "Urgent/Action Required." 
*   **Style:** `rounded-full`, low-contrast text. These should feel like soft pills, not loud alerts.

### Input Fields
*   **Style:** `surface_container_low` background, no border. Focus state: 2px "Ghost Border" using `primary`.
*   **Radius:** `rounded-md` (0.75rem) to provide a slight visual distinction from the larger container cards.

### Additional Signature Component: The "Scholarship Progress Orbit"
A custom radial progress indicator using a `primary` to `primary_container` gradient, used in the dashboard to show funding depletion or application completion rates. It should use a heavy stroke weight and rounded caps for a premium, custom feel.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a luxury. If a section feels crowded, increase the padding rather than adding a divider.
*   **DO** use "Anáhuac Orange" sparingly as a "star of the show" color—too much of it will degrade the premium feel.
*   **DO** ensure all text on `primary_container` meets AA accessibility standards (use `on_primary_container`).

### Don't
*   **DON'T** use 1px lines to separate list items. Use a `surface-container-low` background on every second item or simply provide 16px of vertical breathing room.
*   **DON'T** use default "System" shadows. They are too dark and look "out-of-the-box."
*   **DON'T** use standard "Success Green." Use our `tertiary` blue scale for a more institutional and sophisticated "Positive" state.