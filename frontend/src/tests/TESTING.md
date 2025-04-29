# SokoClick Testing Guide

This document provides guidelines and instructions for testing the SokoClick UI/UX components.

## Table of Contents

1. [Component Testing](#component-testing)
2. [Accessibility Testing](#accessibility-testing)
3. [Performance Testing](#performance-testing)
4. [Cross-Browser & Device Testing](#cross-browser-device-testing)
5. [User Testing](#user-testing)

## Component Testing

### Setup

We use Vitest with React Testing Library for component testing.

```bash
# Run all tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage

# View test UI
npm run test:ui
```

### Writing Component Tests

- Create test files with the pattern `*.test.tsx` or `*.spec.tsx` next to the component files
- Follow the Arrange-Act-Assert pattern
- Test component behavior, not implementation details
- Mock external dependencies using `vi.mock()`

Example:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Accessibility Testing

### Automated Testing

We use several tools for accessibility testing:

1. **jest-axe**: For unit testing components
2. **Lighthouse CI**: For page-level testing
3. **AccessibilityDevTool**: For runtime testing during development

#### Using jest-axe in tests

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MyComponent from './MyComponent';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Using the AccessibilityDevTool

The `AccessibilityDevTool` is available in development mode and can be accessed from the bottom-right corner of the screen. It provides real-time accessibility checking.

### Manual Testing

- Test keyboard navigation (Tab, Enter, Space, Arrow keys)
- Test with a screen reader (NVDA, VoiceOver, JAWS)
- Verify color contrast meets WCAG standards
- Check heading hierarchy is logical
- Ensure all interactive elements have accessible names

### WCAG Compliance Checklist

- Text alternatives for non-text content
- Adaptable content presentation
- Distinguishable content (color, contrast)
- Keyboard accessible functionality
- Sufficient time to read and use content
- Seizure prevention
- Navigable content
- Readable and understandable text
- Predictable operation
- Input assistance
- Compatible with assistive technologies

## Performance Testing

### Lighthouse Performance

We use Lighthouse CI to measure performance:

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse audit
lhci autorun
```

### Performance Metrics to Monitor

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Total Blocking Time (TBT) < 200ms
- Time to Interactive (TTI) < 3.8s

### Performance Optimization Techniques

- Lazy load components and images
- Code splitting
- Memoization for expensive calculations
- Optimize bundle size
- Use efficient list rendering
- Reduce unnecessary re-renders

## Cross-Browser & Device Testing

### Automated Testing with Playwright

We use Playwright for cross-browser and device testing:

```bash
# Install Playwright browsers
npx playwright install

# Run cross-browser tests
npx playwright test

# Run tests on specific browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests on mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Manual Testing Checklist

Test these features on all browsers and devices:

- Layout and visual appearance
- Functionality of interactive elements
- Form validation
- Animations and transitions
- Responsive behavior
- Touch interactions on mobile devices

### Supported Environments

#### Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

#### Devices
- Desktop (Windows, macOS)
- Mobile (iOS, Android)
- Tablet (iPad, Android tablets)

## User Testing

### User Testing Methods

1. **Task-based testing**: Ask users to complete specific tasks
2. **Think-aloud protocol**: Ask users to vocalize their thoughts
3. **A/B testing**: Compare different design versions
4. **Surveys**: Collect feedback on specific features
5. **Heat maps**: Track user interactions

### User Testing Tasks

Example tasks to test SokoClick's functionality:

1. Create a new account
2. Search for specific products
3. Add a product to favorites
4. Navigate through product categories
5. Complete a purchase flow
6. Update account settings
7. Use the guided tour feature
8. Interact with notifications
9. Filter and sort products
10. Use the feedback system

### Gathering Feedback

Use the built-in `FeedbackCollector` component to gather specific feedback:

```tsx
import { FeedbackCollector } from '../components/experience/FeedbackCollector';

// Example usage
<FeedbackCollector
  survey={{
    id: 'search-feature',
    title: 'Search Feature Feedback',
    questions: [
      {
        id: 'ease',
        type: 'rating',
        question: 'How easy was it to find what you were looking for?',
        required: true,
      },
      {
        id: 'improvement',
        type: 'text',
        question: 'How could we improve the search experience?',
      }
    ],
    trigger: 'manual',
    position: 'bottom-right',
  }}
  isOpen={true}
  onSubmit={handleFeedbackSubmit}
/>
```

## Reporting Issues

When reporting issues, include:

1. The component or feature affected
2. Steps to reproduce
3. Expected vs. actual behavior
4. Browser/device information
5. Screenshots or videos
6. Relevant console errors
7. User impact severity

Use the issue template provided in the repository. 