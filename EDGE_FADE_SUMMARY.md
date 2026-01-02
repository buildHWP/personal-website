# Edge Fade Overlay - Compressed Summary

## Key Concept
Create a light grey translucent overlay that fades in from all 4 edges (top, bottom, left, right) with proper corner handling to prevent opacity doubling.

## Corner Doubling Solution
When two semi-transparent gradients overlap in corners, opacity combines as: `combined = 1 - (1-a)(1-b)`

**Formula to calculate per-gradient opacity:**
- Desired corner opacity = `0.45`
- Solve: `0.45 = 1 - (1-x)²`
- Result: `x ≈ 0.26` (each gradient uses 0.26, corners = 0.45)

## Current Implementation

**Width:** 65px fade from each edge

**Opacity Curve:**
- Starts at `0.26` at edges (0px)
- Higher rate of change near start (ease-out curve)
- Fades to `0` at 65px
- Key stops: 0.26→0.21→0.16→0.13→0.09→0.07→0.05→0.04→0.03→0.02→0.01→0

**CSS Variable:**
```css
--overlay-gradient: 
    linear-gradient(to right, [gradient stops]),
    linear-gradient(to bottom, [gradient stops]);
```

**Gradient Stops (65px):**
- 0px: 0.26
- 6px: 0.21
- 12px: 0.16
- 18px: 0.13
- 24px: 0.09
- 30px: 0.07
- 36px: 0.05
- 42px: 0.04
- 48px: 0.03
- 54px: 0.02
- 59px: 0.01
- 65px: 0
- Then transparent until opposite edge

**Color:** `rgba(200, 200, 200, [opacity])` - light grey translucency

**Implementation:**
```css
.overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: var(--overlay-gradient);
    z-index: 2;
    pointer-events: none;
}
```

## Quick Reference
- **Edge opacity per gradient:** 0.26
- **Corner opacity (doubled):** ~0.45
- **Fade width:** 65px
- **Fade pattern:** Faster change near start, slower toward end
- **Color:** Light grey `rgba(200, 200, 200, ...)`

