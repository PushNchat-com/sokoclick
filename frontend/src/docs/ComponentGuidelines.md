# SokoClick Component Guidelines

This document outlines the standards and best practices for component development in the SokoClick application to ensure consistent visual appearance and behavior.

## Icon Guidelines

### Using StandardIcon Component

Always use the `StandardIcon` component for consistent icon handling:

```jsx
import StandardIcon from '../ui/StandardIcon';

// Example usage:
<StandardIcon name="Location" size="sm" />
<StandardIcon name="WhatsApp" size="md" className="text-whatsapp" />
```

### Icon Sizes

Use the predefined sizes for icons:

- `xs`: 12px (for badges, small indicators)
- `sm`: 16px (for button icons, list items)
- `md`: 24px (default size, standalone icons)
- `lg`: 32px (featured icons, header elements)
- `xl`: 40px (large feature icons)

Do not use raw pixel values directly in components.

## Image Guidelines

### Using ResponsiveImage Component

Use the `ResponsiveImage` component for all images in the application:

```jsx
import ResponsiveImage from '../ui/ResponsiveImage';

// Example usage:
<ResponsiveImage 
  src={product.mainImage}
  alt={product.title}
  imageSize="product"
  aspectRatio="square"
  objectFit="cover"
/>
```

### Image Sizes

Use predefined image sizes:

- `xs`: 120px height
- `sm`: 160px height
- `md`: 192px height
- `lg`: 240px height
- `product`: 192px (standard product image)
- `thumbnail`: 64px (thumbnails)

### Aspect Ratios

Use consistent aspect ratios:

- `square`: 1:1 (product cards, avatars)
- `16:9`: widescreen (banners, videos)
- `4:3`: standard (product images)
- `3:2`: landscape (feature images)
- `auto`: use natural dimensions

## Card Guidelines

### Dimensions

Cards should use consistent width classes:

```jsx
<div className="w-full md:w-card-md lg:w-card-lg">
  {/* Card content */}
</div>
```

### Card Structure Pattern

Follow this consistent pattern for card components:

```jsx
<div className="relative overflow-hidden rounded-card border border-ui-border">
  {/* Image container - fixed height with overflow handling */}
  <div className="relative overflow-hidden">
    <ResponsiveImage 
      src={imageSrc}
      alt={imageAlt}
      imageSize="product"
      objectFit="cover"
    />
    
    {/* Overlays (price tags, badges) positioned absolutely */}
    <div className="absolute top-2 right-2">
      {/* Price or featured tag */}
    </div>
  </div>
  
  {/* Content section */}
  <div className="p-3 flex-1 flex flex-col">
    <h3 className="text-base font-medium line-clamp-2">{title}</h3>
    
    {/* Details with StandardIcon */}
    <div className="flex items-center text-xs">
      <StandardIcon name="Location" size="xs" className="mr-1" />
      <span>{location}</span>
    </div>
    
    {/* Auto-margin pushes content to bottom */}
    <div className="mt-auto pt-2">
      {/* Bottom content */}
    </div>
  </div>
</div>
```

## Button Guidelines

### Standard Buttons

Use the Button component with consistent props:

```jsx
import Button from '../ui/Button';

// Example usage:
<Button variant="primary" size="md">
  Submit
</Button>
```

### WhatsApp Buttons

Use the WhatsAppButton component for all WhatsApp integrations:

```jsx
import WhatsAppButton from '../product/WhatsAppButton';

// Example usage:
<WhatsAppButton
  phoneNumber="+2376123456789"
  message="Hello, I'm interested in your product."
  variant="default"
/>

// Corner variant for cards
<WhatsAppButton
  phoneNumber="+2376123456789"
  message="Hello, I'm interested in your product."
  variant="corner"
  className="absolute bottom-0 right-0"
/>
```

## Loading States

Use the Skeleton component for consistent loading states:

```jsx
import Skeleton from '../ui/Skeleton';

// Example usage:
<Skeleton variant="productCard" />
<Skeleton variant="text" width="70%" />
```

## Accessibility Guidelines

- All interactive elements must have minimum dimensions of 44x44px
- Use aria-label attributes for buttons without visible text
- Maintain color contrast ratios of at least 4.5:1
- Ensure all interactions are keyboard accessible 