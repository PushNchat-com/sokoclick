# Badge Component

The Badge component is used throughout the SokoClick application to display status indicators, labels, or counts.

## Usage

```jsx
import Badge from '../../components/ui/Badge';

// Basic usage
<Badge>Default Badge</Badge>

// With color variants
<Badge color="primary">Primary Badge</Badge>
<Badge color="secondary">Secondary Badge</Badge>
<Badge color="success">Success Badge</Badge>
<Badge color="warning">Warning Badge</Badge>
<Badge color="danger">Danger Badge</Badge>
<Badge color="info">Info Badge</Badge>

// With size variants
<Badge size="sm">Small Badge</Badge>
<Badge size="md">Medium Badge</Badge>
<Badge size="lg">Large Badge</Badge>

// With custom class names
<Badge className="custom-class">Custom Badge</Badge>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Badge content |
| `color` | 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info' | 'primary' | Badge color variant |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Badge size variant |
| `className` | string | - | Additional class names |

## Color Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `primary` | Default, general information | <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 9999px;">Primary</span> |
| `secondary` | Secondary information | <span style="background-color: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 9999px;">Secondary</span> |
| `success` | Positive states, completion | <span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px;">Success</span> |
| `warning` | Warning states, pending actions | <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px;">Warning</span> |
| `danger` | Error states, destructive actions | <span style="background-color: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 9999px;">Danger</span> |
| `info` | Informational states | <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px;">Info</span> |

## Size Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `sm` | Compact UI, tight spaces | <span style="font-size: 0.75rem; background-color: #dbeafe; color: #1e40af; padding: 0px 8px; border-radius: 9999px;">Small</span> |
| `md` | Default size for most uses | <span style="font-size: 0.875rem; background-color: #dbeafe; color: #1e40af; padding: 0px 10px; border-radius: 9999px;">Medium</span> |
| `lg` | Emphasis, more visibility | <span style="font-size: 1rem; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px;">Large</span> |

## Status Mapping

For consistent status representation across the application, use the following color mappings:

| Status | Color Variant | Example |
|--------|---------------|---------|
| `active` | `primary` | <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 9999px;">Active</span> |
| `pending` | `warning` | <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px;">Pending</span> |
| `available` | `success` | <span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px;">Available</span> |
| `completed` | `info` | <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px;">Completed</span> |
| `cancelled` | `danger` | <span style="background-color: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 9999px;">Cancelled</span> |
| `featured` | `secondary` | <span style="background-color: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 9999px;">Featured</span> | 