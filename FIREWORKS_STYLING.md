# Fireworks Button Effect - Styling Specification

## Overview
A production-ready fireworks effect that triggers on button hover. The effect consists of rockets launching from the button and exploding into various firework patterns across the viewport.

---

## Goal
A button that, when hovered, launches realistic, high-quality fireworks effects. These are NOT simple CSS hover effects — they must feel physically inspired, organic, and visually rich.

---

## General Requirements

### Technical Constraints
- **Use only HTML, CSS, and vanilla JavaScript**
- **Everything must be contained in one HTML file**
- **Must be performant and safe to run continuously**
- **All animations must clean up DOM nodes after finishing**
- **Use requestAnimationFrame or Web Animations API (preferred)**
- **No canvas — use DOM + transforms**
- **Code must be readable, modular, and commented**
- **Button hover must NOT block pointer events**
- **Fireworks may leave the button and travel freely across the viewport**

---

## Button Behavior

### Hover Trigger
- **A single visible button centered on the page**
- **On hover:**
  - Immediately fire **5 rockets**
  - If the user keeps hovering for **5 seconds:**
    - Fire another **5 rockets every 4 seconds**

### Timing
- **Rockets must NOT all fire at the same instant**
- Each burst must be slightly off-timed (staggered by small random delays)

---

## Rocket Ascent (Stage 1)

### Launch Properties
- **Launch point:** Near the bottom of the button
- **Launch angle:** Random between **−90° and +90°** relative to straight up
- **Flight distance:** Randomized between **~90px and ~340px**
  - Longer distances must be **LESS probable** than shorter ones
- **Ascent duration:** Must vary (**~520–980ms**)

### Motion Characteristics
- **Path:**
  - **MUST NOT be straight**
  - Must include small erratic **"wiggles"** that decay over time
- **Rotation:** Rockets rotate slightly during ascent

---

## Explosion (Stage 2)

When a rocket reaches its apex, it explodes into one of several firework styles.

### Global Explosion Features (All Styles)
- Explosion occurs at the rocket's final position
- Add a brief **flash bloom** at the center
- Add an expanding **shockwave ring**
- Sparks fade out naturally and fall with **gravity**
- Sparks have **micro-wiggle** for organic motion
- Sparks clean themselves up after animation

---

## Size Variation

Each explosion must randomly choose a size tier:

### Size Tiers
- **Small** (most common)
- **Medium** (less common)
- **Large** (rare)

### Size Tier Controls
- Number of sparks (optimized: 9/18/30 for small/medium/large)
- Explosion radius
- Spark lifetime (optimized: 1000/1300/1600ms)
- Gravity strength
- Spark size

---

## Firework Styles (Must Implement All)

Each explosion randomly selects **ONE** of the following styles:

### 1. RADIAL
- Classic spherical burst in all directions
- Sparks radiate outward uniformly

### 2. RING
- Sparks form a clean expanding ring
- Secondary ring layer allowed for definition
- Concentric circular pattern

### 3. SPIRAL
- Sparks form rotating spiral arms
- **2 arms** for small/medium
- **3 arms** for large
- Arms twist outward as they expand

### 4. WILLOW
- Long trailing sparks
- Strong downward gravity
- Soft sideways drift late in the animation
- Creates a weeping willow effect

### 5. CRACKLE
- Initial burst followed by multiple delayed micro-bursts
- Crackles originate near explosion center
- Sequential secondary explosions

### 6. CROSSETTE
- Some sparks split mid-flight into **2 perpendicular directions** (optimized for performance)
- Creates a cross or star pattern
- Secondary splitting effect

---

## Timing & Realism

### Spark Ignition
- Sparks should **NOT ignite at the exact same millisecond**
- Use slight random delays per spark

### Motion Physics
- Motion should feel **physically inspired, not mathematical**
- Use easing curves appropriate for fireworks (fast out, slow decay)

---

## Visual Details

### Spark Appearance
- Sparks use small circles (**2–5px**)
- Size varies based on explosion tier

### Color Palette
- **White**
- **Gold / yellow**
- **Red / pink**
- **Cyan / blue**
- **Lime / green**

### Visual Effects
- Use `filter: drop-shadow()` for glow effects (performance-optimized)
- Minimal visual effects to maintain 60fps
- Background should be **dark** to enhance contrast
- Avoid heavy effects like multiple box-shadows

---

## Implementation Structure

### Output Format
- **One complete HTML document**
- Including `<style>` and `<script>`
- Immediately runnable in a browser
- No placeholders
- No pseudo-code
- No explanations — only the final code

### Code Quality
- Readable, modular, and commented
- Production-ready
- Performant
- Safe to run continuously

---

## Important Notes

### Visual Quality Priority
This is for a personal portfolio website.
- **Visual quality matters more than minimalism**
- Prefer realism, variation, and organic motion over simplicity

### Performance Considerations
- Clean up DOM nodes after animations complete
- Use efficient animation techniques (requestAnimationFrame/Web Animations API)
- Avoid memory leaks from orphaned elements

---

## Performance Optimization Principles

### Core Performance Requirements
The fireworks effect must maintain **60fps** even during extended hover sessions and when multiple fireworks are active simultaneously. The following optimizations ensure lightweight, smooth performance.

### Spark Count Optimization
- **Maximum active sparks:** 180 total sparks across all active fireworks
- **Size tier spark counts:**
  - Small: 9 sparks (40% reduction from baseline)
  - Medium: 18 sparks (40% reduction from baseline)
  - Large: 30 sparks (40% reduction from baseline)
- **Spark creation throttling:** Skip creating new sparks when limit is reached

### Lifetime & Cleanup
- **Reduced lifetimes** for faster cleanup:
  - Small: 1000ms
  - Medium: 1300ms
  - Large: 1600ms
- **Early removal:** Remove sparks at 60% progress if off-screen
- **Viewport culling:** 100px padding for aggressive culling

### Rendering Optimizations
- **GPU acceleration:** Use `translate3d()` instead of `translate()` for all transforms
- **Minimal visual effects:**
  - Use `filter: drop-shadow()` instead of `box-shadow` for glow
  - Reduced glow size (0.8x spark size)
  - Single shadow layer maximum
- **DOM update throttling:** Skip DOM updates for off-screen sparks
- **Will-change hints:** Set `will-change: transform, opacity` on spark elements

### Animation Complexity Reduction
- **Micro-wiggle:** 40% reduced amplitude and frequency
- **Spiral rotation:** 40% slower rotation speed and smaller offset
- **Crossette splits:** Reduced from 4 to 2 sparks per split
- **Sustained burst interval:** 2000ms (slower frequency for fewer bursts)

### Throttling & Rate Limiting
- **Active spark tracking:** Monitor total active sparks in real-time
- **Burst throttling:** Skip new bursts when active sparks exceed 50% of limit
- **Viewport-based updates:** Only update DOM for visible or near-visible sparks
- **Frame skipping:** Skip DOM updates for off-screen sparks while maintaining physics

### Memory Management
- **Immediate cleanup:** Remove DOM nodes as soon as animation completes
- **Active count tracking:** Decrement counters on removal to prevent leaks
- **Interval cleanup:** Clear all intervals on mouse leave
- **No orphaned elements:** All elements must be properly removed

### Performance Monitoring
- **Active spark limit:** Hard cap at 180 sparks prevents performance degradation
- **Adaptive throttling:** System automatically reduces new firework creation when busy
- **Viewport awareness:** Aggressive culling of off-screen elements

### Implementation Guidelines
1. **Always use `translate3d()`** for position updates (forces GPU compositing)
2. **Track active spark count** and enforce limits before creation
3. **Skip DOM updates** for elements outside viewport + 100px padding
4. **Remove elements early** when they're off-screen and >60% faded
5. **Throttle sustained bursts** based on current system load
6. **Use minimal visual effects** - prefer filter over box-shadow
7. **Clean up immediately** - don't wait for full animation lifetime

---

## Technical Implementation Notes

### Animation Approach
- Use **Web Animations API** (preferred) or **requestAnimationFrame**
- DOM-based transforms (no canvas)
- **Always use `translate3d()`** for GPU acceleration
- CSS transforms for positioning and rotation
- JavaScript for physics calculations and timing
- Skip DOM updates for off-screen elements

### Cleanup Strategy
- Remove DOM nodes after animation completes
- Clear any intervals/timeouts
- Reset state appropriately

### Staggering Logic
- Random delays between rocket launches (0-200ms range)
- Random delays between spark ignitions (0-50ms range)
- Prevents synchronized, mechanical appearance

### Physics Simulation
- Gravity affects sparks after explosion
- Decay functions for wiggle amplitude
- Easing curves for natural motion
- Random variations for organic feel

---

## Usage Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fireworks Button</title>
    <style>
        /* Styles here */
    </style>
</head>
<body>
    <button class="fireworks-button">Hover Me</button>
    <script>
        /* Implementation here */
    </script>
</body>
</html>
```

---

## Testing Checklist

- [ ] Button fires 5 rockets immediately on hover
- [ ] After 5 seconds of hover, fires 5 more rockets every 4 seconds
- [ ] Rockets have staggered launch times
- [ ] Rockets follow wiggling, non-straight paths
- [ ] All 6 firework styles are implemented and randomly selected
- [ ] Size tiers (small/medium/large) are properly weighted
- [ ] Sparks have micro-wiggle and gravity
- [ ] Flash bloom and shockwave ring appear on explosion
- [ ] DOM nodes are cleaned up after animations
- [ ] Performance is smooth (60fps) with 180+ active sparks
- [ ] Active spark limit enforced (max 180)
- [ ] Viewport culling working correctly
- [ ] GPU acceleration active (translate3d)
- [ ] No performance degradation during extended hover
- [ ] Works across modern browsers
- [ ] Button remains interactive during fireworks

---

## Browser Compatibility

- Modern browsers with Web Animations API support
- Fallback to requestAnimationFrame if needed
- CSS transforms support required
- ES6+ JavaScript features

---

*This specification serves as a complete reference for implementing the fireworks button effect.*

