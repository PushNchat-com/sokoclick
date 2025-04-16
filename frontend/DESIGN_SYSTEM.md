# SokoClick Design System

This document describes the design system implemented for the SokoClick application. The design system provides a consistent set of UI components, typography, colors, and spacing to ensure a cohesive user experience across the application.

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Components](#components)
4. [Spacing](#spacing)
5. [How to Use](#how-to-use)

## Colors

The SokoClick design system uses a color palette based on the brand logo:

- **Primary (Blue)**: Used for main UI elements, buttons, links, and primary actions
- **Accent (Orange)**: Used for emphasizing important elements, call-to-actions, and highlights
- **Grayscale**: Used for text, backgrounds, borders, and secondary elements
- **Semantic Colors**: Success (green), Error (red), Warning (yellow)

The colors are defined as CSS variables in `styles/variables.css` and mapped to Tailwind classes in `tailwind.config.js`.

## Typography

Typography classes are designed to create a clear hierarchy and ensure readability:

### Headings

- `h1` to `h6` classes for headings with responsive sizing
- Implemented as React components: `<H1>`, `<H2>`, etc.

### Body Text

- `body-lg`: Large body text for introductions
- `body-md`: Standard body text (default)
- `body-sm`: Smaller body text for less important content
- `body-xs`: Extra small text for footnotes, disclaimers
- `caption`: Italicized captions
- `overline`: Small uppercase text for labels

## Components

The design system includes the following components:

### Layout

- `Container`: For consistent content width and spacing
- `Card`, `CardHeader`, `CardBody`, `CardFooter`: For content containers

### UI Elements

- `Button`: With variants (primary, secondary, accent, outline, danger, ghost, link)
- `Logo`: The SokoClick logo with variants (default, small, white)
- Form elements (inputs, selects, checkboxes, radios)
- Badges and status indicators
- Alerts
- Tables

## Spacing

The spacing system uses consistent increments for margins, padding, and gaps:

- Based on a 4px grid (0.25rem)
- Common values: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Responsive spacing for different screen sizes

## How to Use

### Importing Components

```tsx
// Using named imports
import { Button, Card, Container } from '../components/ui';

// Or import specific components
import Button from '../components/ui/Button';
```

### Using Typography

```tsx
import { H1, Text } from '../components/ui';

function MyComponent() {
  return (
    <div>
      <H1>Page Title</H1>
      <Text variant="body-lg">Introduction paragraph</Text>
      <Text>Regular body text</Text>
    </div>
  );
}
```

### Using Buttons

```tsx
import { Button } from '../components/ui';

function MyComponent() {
  return (
    <div>
      <Button variant="primary">Primary Action</Button>
      <Button variant="outline">Secondary Action</Button>
      <Button variant="accent" size="lg">Large Accent Button</Button>
    </div>
  );
}
```

### Using Cards

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>Card Title</CardHeader>
      <CardBody>Main content goes here</CardBody>
      <CardFooter>Actions or additional info</CardFooter>
    </Card>
  );
}
```

## Documentation

For complete documentation and examples, visit the [Design System page](/design-system) in the application (admin access required). 