# Rotating Hue Border Effect - Compressed Summary

## Key Concept
Create an animated rotating rainbow/prismatic border that cycles through a color palette using a conic gradient. The gradient rotates continuously, creating a dynamic, eye-catching border effect that can be triggered on hover or applied permanently.

## Core Principle
Use a **conic-gradient** with an animatable angle variable, combined with CSS `@property` to enable smooth animation of the gradient's rotation angle.

## Technical Foundation

### CSS @property for Animatable Custom Properties
The magic ingredient is `@property`, which allows CSS custom properties to be animatable:

```css
@property --rainbow-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}
```

**Why this matters:** Without `@property`, CSS cannot animate custom properties. This declaration tells the browser that `--rainbow-angle` is an angle type that can be smoothly animated.

### Conic Gradient Structure
A conic gradient starts from a center point and rotates around it:

```css
background: conic-gradient(
    from var(--rainbow-angle),
    color1 0deg,
    color2 36deg,
    color3 72deg,
    ...
    color1 360deg  /* Loop back to start */
);
```

**Key points:**
- `from var(--rainbow-angle)` - Starting angle (animatable)
- Colors distributed evenly around 360 degrees
- Last color should match first for seamless loop

## Current Implementation (Email Icon)

**Trigger:** Hover state (`.email-icon-container:hover::after`)

**Animation Duration:** 3 seconds, linear, infinite

**Color Palette:** 10 colors evenly distributed (36deg per color)
- lemon-chiffon: 0deg
- powder-petal: 36deg
- cotton-rose: 72deg
- pink-orchid: 108deg
- mauve: 144deg
- baby-blue-ice: 180deg
- frosted-blue: 216deg
- electric-aqua: 252deg
- aquamarine: 288deg
- celadon: 324deg
- lemon-chiffon: 360deg (loop)

**Border Mask Technique:**
```css
-webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
mask-composite: exclude;
padding: 1px;
```

This creates a 1px border by masking everything except the border area.

## Implementation Pattern

### Step 1: Define the Animatable Property
```css
.element {
    --rainbow-angle: 0deg;
}

@property --rainbow-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}
```

### Step 2: Create the Rotating Gradient
```css
.element::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: [match parent];
    padding: 1px; /* Border width */
    background: conic-gradient(
        from var(--rainbow-angle),
        var(--color-1) 0deg,
        var(--color-2) [angle],
        ...
        var(--color-n) 360deg
    );
    /* Border mask */
    -webkit-mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0; /* Hidden by default */
    animation: rotateGradient 3s linear infinite;
    pointer-events: none;
    z-index: 0;
}
```

### Step 3: Define the Rotation Animation
```css
@keyframes rotateGradient {
    from {
        --rainbow-angle: 0deg;
    }
    to {
        --rainbow-angle: 360deg;
    }
}
```

### Step 4: Trigger Visibility (Hover or Always-On)
```css
/* Hover trigger */
.element:hover::after {
    opacity: 1;
}

/* Always-on */
.element::after {
    opacity: 1; /* Remove opacity: 0 */
}
```

## Applying to Other Elements

### Always-On Rotating Border
Remove the opacity control and hover requirement:

```css
.my-element {
    --rainbow-angle: 0deg;
    position: relative;
}

.my-element::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px; /* Adjust border width */
    background: conic-gradient(
        from var(--rainbow-angle),
        var(--lemon-chiffon) 0deg,
        var(--powder-petal) 36deg,
        /* ... rest of palette ... */
        var(--lemon-chiffon) 360deg
    );
    -webkit-mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 1; /* Always visible */
    animation: rotateGradient 3s linear infinite;
    pointer-events: none;
    z-index: 0;
}
```

### With Document Context (Scroll/Viewport Based)
You can trigger the effect based on scroll position or viewport visibility:

```css
/* Start animation when element is in viewport */
.my-element.in-view::after {
    opacity: 1;
    animation: rotateGradient 3s linear infinite;
}

/* Or use Intersection Observer in JS */
```

### Variable Speed Control
Add a CSS variable for animation speed:

```css
.my-element {
    --rotation-speed: 3s;
}

@keyframes rotateGradient {
    from { --rainbow-angle: 0deg; }
    to { --rainbow-angle: 360deg; }
}

.my-element::after {
    animation: rotateGradient var(--rotation-speed) linear infinite;
}

/* Fast rotation */
.my-element.fast {
    --rotation-speed: 1s;
}

/* Slow rotation */
.my-element.slow {
    --rotation-speed: 6s;
}
```

### Pause on Hover
```css
.my-element::after {
    animation: rotateGradient 3s linear infinite;
}

.my-element:hover::after {
    animation-play-state: paused;
}
```

## Color Distribution Formula

For N colors, distribute evenly:
- **Angle per color:** `360deg / N`
- **Color positions:** `0deg, (360/N)deg, (720/N)deg, ..., 360deg`

**Example with 8 colors:**
- Each color: `45deg` apart
- Positions: `0deg, 45deg, 90deg, 135deg, 180deg, 225deg, 270deg, 315deg, 360deg`

## Border Width Control

The border width is controlled by the `padding` value in the `::after` pseudo-element:

```css
padding: 1px;  /* 1px border */
padding: 2px;  /* 2px border */
padding: 3px;  /* 3px border */
```

## Performance Considerations

1. **Hardware Acceleration:** The animation uses `transform`-like properties (angle), which are GPU-accelerated
2. **Infinite Animation:** Runs continuously - consider pausing when not visible
3. **Multiple Instances:** Each element with this effect creates its own animation - limit for performance
4. **Browser Support:** `@property` requires modern browsers (Chrome 85+, Safari 16.4+, Firefox 101+)

## Quick Reference

- **Property Declaration:** `@property --rainbow-angle { syntax: '<angle>'; }`
- **Gradient Type:** `conic-gradient(from var(--rainbow-angle), ...)`
- **Animation:** `rotateGradient` keyframes (0deg → 360deg)
- **Border Mask:** XOR mask composite with content-box
- **Default Duration:** 3s linear infinite
- **Trigger:** Hover (opacity: 0 → 1) or always-on (opacity: 1)
- **Color Count:** 10 colors = 36deg per color
- **Border Width:** Controlled by `padding` value

## Common Patterns

### Pattern 1: Hover-Only (Current Email Icon)
```css
.element::after { opacity: 0; }
.element:hover::after { opacity: 1; }
```

### Pattern 2: Always-On
```css
.element::after { opacity: 1; }
```

### Pattern 3: Scroll-Triggered
```css
.element::after { opacity: 0; }
.element.in-view::after { opacity: 1; }
```

### Pattern 4: Click/Toggle
```css
.element::after { opacity: 0; }
.element.active::after { opacity: 1; }
```

## Troubleshooting

**Animation not working:**
- Ensure `@property` is declared before use
- Check browser support for `@property`
- Verify the custom property name matches exactly

**Border not showing:**
- Check mask-composite syntax (browser prefixes)
- Verify `padding` value is set
- Ensure `z-index` is correct (usually 0 or below content)

**Colors not rotating:**
- Verify `from var(--rainbow-angle)` is in conic-gradient
- Check animation keyframes update the angle variable
- Ensure animation is applied to `::after` element

**Performance issues:**
- Reduce number of animated elements
- Consider `will-change: transform` (though angle animation is already optimized)
- Pause animations when not visible

