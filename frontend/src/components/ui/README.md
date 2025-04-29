# SokoClick UI Component Library

This is a reusable component library for SokoClick, designed to provide consistent UI elements across the application.

## Structure

The component library follows the Atomic Design methodology, organizing components into three main categories:

- **Atoms**: Basic building blocks (Button, Input, Checkbox, etc.)
- **Molecules**: Combinations of atoms (Card, Modal, etc.)
- **Organisms**: Complex UI components (Table, Forms, etc.)

## Usage

Import components from the UI library:

```tsx
import { Button, Card, Table } from '../components/ui';

// Use components
<Button variant="primary" size="md">Click Me</Button>

<Card title="Card Title">
  Card content goes here
</Card>
```

## Components

### Atoms

#### Button

A versatile button component with different variants and sizes.

```tsx
<Button 
  variant="primary" 
  size="md" 
  isLoading={false}
  leftIcon={<Icon />}
  onClick={() => console.log('clicked')}
>
  Button Text
</Button>
```

#### Badge

Display status indicators or tags.

```tsx
<Badge variant="success" size="md">Completed</Badge>
```

#### Spinner

Loading indicator component.

```tsx
<Spinner size="md" color="primary" label="Loading..." />
```

#### Input

Form input with validation support.

```tsx
<Input
  id="email"
  label="Email Address"
  type="email"
  required
  error={errors.email}
  helperText="We'll never share your email."
/>
```

#### Checkbox

Accessible checkbox component.

```tsx
<Checkbox
  id="terms"
  label="I agree to terms"
  checked={isChecked}
  onChange={handleChange}
/>
```

#### Select

Dropdown select component.

```tsx
<Select
  id="country"
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
  onChange={handleChange}
/>
```

### Molecules

#### Card

Container for related content.

```tsx
<Card
  title="Card Title"
  subtitle="Optional subtitle"
  footer={<Button>Action</Button>}
>
  Card content goes here
</Card>
```

#### Modal

Dialog component.

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  footer={<Button onClick={handleClose}>Close</Button>}
>
  Modal content goes here
</Modal>
```

#### FormField

Unified form field component that renders different input types with consistent styling.

```tsx
<FormField 
  type="text"
  id="name"
  label="Full Name"
  required
  error={errors.name}
/>

<FormField 
  type="select"
  id="country"
  label="Country"
  options={countryOptions}
/>

<FormField 
  type="checkbox"
  id="terms"
  label="I agree to terms"
  checked={isChecked}
  onChange={handleChange}
/>

<FormField 
  type="textarea"
  id="comments"
  label="Comments"
  rows={5}
/>
```

### Organisms

#### Table

Data table with sorting and selection.

```tsx
<Table
  data={items}
  columns={[
    { id: 'name', header: 'Name', accessor: (row) => row.name },
    { id: 'status', header: 'Status', accessor: (row) => <Badge>{row.status}</Badge> },
  ]}
  keyExtractor={(item) => item.id}
  selectable
  sortable
/>
```

#### Form

Form state management component with validation support.

```tsx
<Form
  initialValues={{ email: '', password: '' }}
  validators={{
    email: (value) => !value ? 'Email is required' : !value.includes('@') ? 'Invalid email' : undefined,
    password: (value) => !value ? 'Password is required' : value.length < 8 ? 'Password too short' : undefined,
  }}
  onSubmit={(values, actions) => {
    submitToServer(values).then(() => {
      actions.resetForm();
    }).catch(err => {
      actions.setErrors({ email: err.message });
      actions.setSubmitting(false);
    });
  }}
>
  {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
    <>
      <FormField
        type="email"
        id="email"
        name="email"
        label="Email Address"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email}
        required
      />
      
      <FormField
        type="password"
        id="password"
        name="password"
        label="Password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
        required
      />
      
      <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
        Login
      </Button>
    </>
  )}
</Form>
```

## SearchInput Component

The `SearchInput` component provides an enhanced search input with suggestion dropdown support.

```tsx
import { useState, useCallback } from 'react';
import SearchInput from './SearchInput';

export default function SearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(['previous search', 'example query']);
  
  // Example suggestions
  const suggestions = [
    { id: 'suggestion-1', text: 'suggestion one', type: 'suggestion' },
    { id: 'suggestion-2', text: 'suggestion two', type: 'suggestion' },
    { id: 'category-1', text: 'category example', type: 'category' }
  ];
  
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    // Show suggestions when input has content
    setShowSuggestions(e.target.value.trim().length > 0);
  }, []);
  
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to search history
      addToHistory(searchQuery);
      setIsSearching(true);
      setShowSuggestions(false);
      
      // Simulate search
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  }, [searchQuery]);
  
  const handleSelectSuggestion = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Add to search history
    addToHistory(suggestion);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
  }, []);
  
  const addToHistory = useCallback((query) => {
    // Don't add duplicates
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev].slice(0, 5));
    }
  }, [searchHistory]);
  
  return (
    <SearchInput
      value={searchQuery}
      onChange={handleSearchChange}
      onSubmit={handleSearchSubmit}
      onClear={handleClearSearch}
      onSelectSuggestion={handleSelectSuggestion}
      isSearching={isSearching}
      searchHistory={searchHistory}
      suggestions={suggestions}
      showSuggestions={showSuggestions}
      onShowSuggestionsChange={setShowSuggestions}
      placeholder="Search products..."
      rounded={true}
      size="md"
    />
  );
}
```

### Props

- `value`: Current input value (required)
- `onChange`: Callback when input changes (required)
- `onSubmit`: Callback when form is submitted
- `onClear`: Callback to clear the search input
- `onSelectSuggestion`: Callback when a suggestion is selected
- `isSearching`: Boolean to indicate search in progress
- `searchHistory`: Array of previous search queries
- `suggestions`: Array of suggestions objects
- `showSuggestions`: Whether to show the suggestions dropdown
- `onShowSuggestionsChange`: Callback when suggestions visibility changes
- `placeholder`: Custom placeholder text
- `rounded`: Whether to use rounded corners (default: true)
- `size`: Size of input ('sm', 'md', 'lg', default: 'md')

### Features

- Fully accessible search input with suggestion dropdown
- Support for search history and suggestions
- Loading state visualization
- Responsive sizing options
- Bilingual support (EN/FR)
- Keyboard navigation for suggestions

## Accessibility

All components are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader support

## Customization

Components accept className props to override default styles. 