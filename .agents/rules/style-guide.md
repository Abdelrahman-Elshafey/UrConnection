---
trigger: always_on
---

The "Aspirational Minimalism with Adaptive Theme" UI Design Brief Prompt
Role Context: You are a Lead Frontend Architect and Senior Product Designer specializing in premium, high-converting e-commerce showcases.

Objective: Design and code a responsive user interface for a premier hardware or lifestyle brand. The design must embody "Aspirational Minimalism" with a seamless, high-fidelity light/dark theme implementation. The focus is on immaculate cleanliness, sharp typographic hierarchy, and allowing immersive product imagery to tell the story.

1. Design Philosophy & General Aesthetic
Minimalism as Luxury: Whitespace (negative space) is an active design element, not just empty space. Every pixel must have a clear purpose.

Product-Centricity: The UI exists only to frame the product. Use edge-to-edge, ultra-high-resolution assets with shallow depth-of-field or isometric views.

Dynamic Band Structure: The layout is constructed of horizontal, full-bleed sections (bands). These bands alternate color based on the current theme (e.g., Light Gray and Pure White in Light Mode; Deep Midnight Gray and Pure Black in Dark Mode) to create a sense of depth and focus shift.

2. Typographic Hierarchy (Adaptive Contrast)
Font Family: Use a clean, modern geometric sans-serif font family (e.g., San Francisco, Inter, Geist) throughout.

The "Display" Headlines: Headlines are exceptionally large (e.g., text-6xl to text-8xl), bold, with tight letter spacing (tracking) to feel compact and high-end.

Subheadings: Slightly smaller, medium weight, providing context immediately beneath the headline.

Body Copy: Sparse and impactful. High line-height for readability.

High-Contrast Text: Text colors must switch perfectly (Pure Black on Pure White background, or Pure White on Pure Black background). Muted text is only for secondary legal text in the footer.

3. Component Breakdown & Component Behavior
A. Adaptive Global Navigation
Style: Minimalist, centered horizontal list of key categories (e.g., "Hardware", "Services", "Support"). Icons only for "Search" and "Bag/Cart".

Behavior: Sticky at the top. Must have an advanced backdrop-blur (acrylic effect).

Light Mode Nav: Semi-transparent white background (#FFFFFFBF).

Dark Mode Nav: Semi-transparent deep gray background (#1D1D1FBF).

B. The Immersive Hero Section
Layout: Centered content with a massive, edge-to-edge asset of the "flagship" product. Content must include the display headline, subheading, and two clean call-to-action links.

C. Alternating Product Feature Bands
Grid Pattern: Alternating 50/50 split sections (e.g., Section 1: Image Left, Text Right; Section 2: Text Left, Image Right).

Immersive Bands: Use full-width bands where the product asset is the background, with centered text overlaid.

D. The Detailed Utility Footer
Style: Very detailed, multi-column sitemap with strict legal disclaimers.

Contrast in Dark Mode: When the main site is in dark mode, the footer background shifts to a very deep, muted gray (#1D1D1F), keeping text readability high but subtly different from the main black background.

4. Color Palette & Interactions
Accent Color: Use ONE vibrant, signature accent color sparingly for CTAs and highlights (e.g., a specific blue #0071e3). This accent must remain consistent and accessible in both themes.

Micro-interactions: Motion is key. Refined fade-ins on scroll, subtle parallax effects on large background assets, and smooth transitions when switching themes.

5. Premium Dark Mode Implementation (Adaptive UI)
Intuitive Theme Logic: The site must detect the user's system preference (prefers-color-scheme: dark) and automatically load the correct theme. A subtle toggle switch should allow the user to manually override the preference.

Color Space Shift (Not Just Inversion):

Main Backgrounds: Shift from Pure White (#FFFFFF) to a deep, focused Pure Black (#000000).

Alternating Backgrounds: Shift from Light Gray (#F5F5F7) to a subtle Deep Midnight Gray (#1D1D1F) for nested sections.

Depth Hierarchy: In dark mode, depth is created by moving from darker grays (base layer) to slightly lighter grays (elevated components), never pure black-on-pure black.

Text Adaptation: Text must flip perfectly: pure black text shifts to Pure White (#FFFFFF) or off-white (#F5F5F7) for body copy, avoiding harsh #FFFFFF for large bodies of text.

Asset Management: The UI must display theme-specific product renders where necessary (e.g., showing the hardware with a dark, moody studio render when dark mode is active).

Shadows: Shadows are rarely used in the main interface, but in dark mode, any elevated component must use very subtle "glow" effects or slightly lighter gray borders instead of traditional black shadows to create the illusion of elevation.

5. Layout Hierarchy:

Hero Section: A minimalist search-centric hero. Large input fields for "Find your group who shares you same interest" and  (Country/City)".

Global Discovery Bar: A sticky filter bar featuring dropdowns for Country (All), City (Selected), and Subject Category.

The Grid (Group Feed): A responsive 3 or 4-column grid of "Groups".

Card Content: Subject tag, Group Title, Member count, Location (City, Country), and a "Join" or "View Details" button.

Sidebar/Navigation: Clean top navigation with "Create a Group", "My Groups", and "Profile".

6. User Flow (UX):

Zero Friction: The user should land on a page that immediately detects their location and shows local groups.

Community Proof: Display "Social Proof" elements like "X students active now" or "X groups in your city".

Action-Oriented: Every group card must have a clear primary action to reduce the steps between discovery and joining.

