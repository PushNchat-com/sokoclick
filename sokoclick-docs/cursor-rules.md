---
# Specify the following for Cursor rules
description: Coding rules and guidelines for the SokoClick project
alwaysApply: false
---

# SokoClick Cursor Rules

This document defines the coding rules and guidelines for the SokoClick project. These rules help maintain code quality, consistency, and align with the project's design requirements.

## Rules Configuration

```json
{
  "version": 1,
  "rules": [
    {
      "description": "Follow TypeScript best practices",
      "filePattern": "**/*.{ts,tsx}",
      "rule": "Always use TypeScript interfaces or types for component props and state. Prefer interfaces for public APIs and types for internal/complex types. Use proper type annotations for all functions, especially async functions. Avoid using 'any'.",
      "alwaysApply": true
    },
    {
      "description": "Maintain bilingual content support",
      "filePattern": "**/*.{ts,tsx}",
      "rule": "All user-facing text content must support both English and French languages. Use the format { en: 'English text', fr: 'French text' } for content objects. Never hardcode text directly in components without i18n support.",
      "alwaysApply": true 
    },
    {
      "description": "Use proper WhatsApp formatting",
      "filePattern": "**/*.{ts,tsx}",
      "rule": "WhatsApp numbers must always be in international format with a '+' prefix (e.g., '+237XXXXXXXXX'). Include proper validation when collecting WhatsApp numbers. WhatsApp button components should pre-format product inquiry messages.",
      "alwaysApply": true
    },
    {
      "description": "Apply mobile-first UI principles",
      "filePattern": "**/*.{ts,tsx,css}",
      "rule": "Design for mobile devices first. Use responsive design patterns with Tailwind CSS breakpoints. Touch targets should be at least 44×44px. Ensure content is readable on small screens without horizontal scrolling.",
      "alwaysApply": true
    },
    {
      "description": "Follow Supabase data access patterns",
      "filePattern": "src/services/**/*.ts",
      "rule": "Use the Supabase client consistently for data access. Handle errors properly with try/catch blocks. Use RLS policies for security rather than client-side authorization checks. Follow the established service pattern for database operations.",
      "alwaysApply": true
    },
    {
      "description": "Maintain slot-based product structure",
      "filePattern": "src/(components|pages)/**/*.{ts,tsx}",
      "rule": "The platform operates on exactly 25 fixed slots. Always reference products by their slot number in the UI. Ensure all grid layouts correctly handle the 25-slot model. Admin interfaces must maintain this slot paradigm.",
      "alwaysApply": true
    },
    {
      "description": "Follow SQL schema guidelines",
      "filePattern": "supabase/migrations/**/*.sql",
      "rule": "Use lowercase for SQL keywords and snake_case for identifiers. Always include the public schema prefix. Enable RLS on all tables. Write granular RLS policies for each operation. Set search_path to '' in functions. Use security invoker for functions. Add comments to all tables.",
      "alwaysApply": true
    },
    {
      "description": "Handle image optimization",
      "filePattern": "src/**/*.{ts,tsx}",
      "rule": "Implement lazy loading for all product images. Use appropriate image formats (WebP with fallbacks). Apply responsive image sizing with srcset or similar techniques. Enable placeholder loading states for slower connections.",
      "alwaysApply": true
    },
    {
      "description": "Implement proper error handling",
      "filePattern": "src/**/*.{ts,tsx}",
      "rule": "Implement comprehensive error handling for all async operations. Show user-friendly error messages in both English and French. Log errors to the console in development and to Sentry in production. Never expose raw error details to users.",
      "alwaysApply": true
    },
    {
      "description": "Align with Supabase database schema",
      "filePattern": "src/(models|types|interfaces)/**/*.ts",
      "rule": "Frontend data models must strictly align with the Supabase schema defined in migrations. Use snake_case to camelCase conversion for property names. Ensure all required fields from the database schema are properly typed. Follow the exact data types and constraints defined in the database schema.",
      "alwaysApply": true
    },
    {
      "description": "Implement proper WhatsApp number validation",
      "filePattern": "src/**/*.{ts,tsx}",
      "rule": "Use the same WhatsApp validation pattern as defined in the database: regex pattern '^\\+[0-9]{1,15}$'. Ensure all WhatsApp number inputs are validated before submission to match database constraints. Display appropriate error messages for invalid formats.",
      "alwaysApply": true
    },
    {
      "description": "Handle product status correctly",
      "filePattern": "src/(components|pages)/**/*.{ts,tsx}",
      "rule": "Products have specific status values in the database: 'pending', 'approved', 'rejected', or 'inactive'. Frontend components must handle and display these statuses appropriately. Only show 'approved' products on public pages. Implement proper filtering based on product status.",
      "alwaysApply": true
    },
    {
      "description": "Follow auction slot relationship model",
      "filePattern": "src/(services|hooks)/**/*.ts",
      "rule": "Maintain the core relationship between products and auction slots as defined in the database. A slot can have at most one active product at a time. Services must enforce that start_time and end_time are required for active slots. Respect the 1-25 slot number range enforced by the database.",
      "alwaysApply": true
    },
    {
      "description": "Support bilingual product data",
      "filePattern": "src/(components|pages)/**/*.{ts,tsx}",
      "rule": "Product data in the database has separate English and French fields (name_en/name_fr, description_en/description_fr). Components must properly handle both languages and display content based on the user's selected language. Forms must collect and validate both language fields.",
      "alwaysApply": true
    },
    {
      "description": "Track analytics events",
      "filePattern": "src/(services|hooks)/**/*.ts",
      "rule": "Implement analytics tracking to match the database schema's analytics_events table. Track product views, WhatsApp contacts, and other user interactions. Include slot_id, product_id, and language information in tracked events to match the database structure.",
      "alwaysApply": true
    },
    {
      "description": "Enforce delivery options structure",
      "filePattern": "src/(components|forms)/**/*.{ts,tsx}",
      "rule": "Delivery options in the database include name_en/name_fr, areas, estimated_days, and fee fields. Components and forms must collect and display this exact structure. Validate that estimated_days is greater than 0 and fee is non-negative to match database constraints.",
      "alwaysApply": true
    },
    {
      "description": "Handle seller verification status",
      "filePattern": "src/(components|pages)/**/*.{ts,tsx}",
      "rule": "The database tracks seller verification with is_verified and verification_level fields. UI components must clearly indicate verification status and level ('basic' or 'complete'). Show appropriate verification badges based on these database fields.",
      "alwaysApply": true
    },
    {
      "description": "Guide for writing database migrations",
      "filePattern": "supabase/migrations/**/*.sql",
      "rule": "Ensure migration files follow the YYYYMMDDHHmmss_short_description.sql format. Include clear comments. Make migrations idempotent when possible. Avoid destructive operations without clear comments. Follow the RLS policy guidelines.",
      "alwaysApply": false
    },
    {
      "description": "Guidelines for writing database functions",
      "filePattern": "supabase/migrations/**/*.sql",
      "rule": "Use SECURITY INVOKER for functions. Always set search_path to ''. Use fully qualified names for all database objects. Prefer IMMUTABLE or STABLE functions when possible. Include proper error handling in PLpgSQL functions.",
      "alwaysApply": false
    },
    {
      "description": "Guidelines for writing RLS policies",
      "filePattern": "supabase/migrations/**/*.sql",
      "rule": "Create individual policies for each operation (SELECT, INSERT, UPDATE, DELETE). Always use the TO clause to specify roles. Use USING for SELECT/DELETE and WITH CHECK for INSERT/UPDATE. Wrap auth.uid() calls with SELECT. Avoid unnecessary JOINs in policy definitions.",
      "alwaysApply": false
    },
    {
      "description": "Authentication Implementation Standards",
      "filePattern": "src/(components|services|contexts)/auth/**/*.{ts,tsx}",
      "rule": "Authentication must follow these strict guidelines:\n- Use Supabase Auth for all authentication operations\n- Implement proper error handling with bilingual messages\n- Maintain password strength validation using validatePasswordStrength utility\n- Phone number validation must use validateAndFormatPhone for Cameroon format\n- Track all authentication events using trackSecurityEvent\n- Auth context must handle token refresh and session persistence\n- Auth state changes must trigger appropriate UI updates\n- Protected routes must use AuthGuard component\n- Modifications to auth implementation require explicit approval",
      "alwaysApply": true
    },
    {
      "description": "Language System Implementation",
      "filePattern": "src/**/*.{ts,tsx}",
      "rule": "All user-facing text must use the LanguageContext system:\n- Import useLanguage hook from LanguageContext\n- Use t() function for all text content\n- Text content must be in {en: string, fr: string} format\n- No direct string literals in components\n- No external i18n libraries allowed\n- Language toggle must be accessible in navigation\n- Persist language preference in localStorage\n- Default to browser language preference\n- Fallback to English if translation missing",
      "alwaysApply": true
    },
    {
      "description": "Authentication Security Requirements",
      "filePattern": "src/services/auth.ts",
      "rule": "Security measures for authentication:\n- Implement rate limiting for login attempts\n- Track and log authentication events\n- Secure password reset flow\n- Session timeout handling\n- Clear sensitive data on logout\n- Validate all auth-related inputs\n- Proper error handling with audit logs\n- No sensitive data in localStorage\n- Use secure HTTP-only cookies",
      "alwaysApply": true
    },
    {
      "description": "Protected Route Implementation",
      "filePattern": "src/components/auth/AuthGuard.tsx",
      "rule": "Protected routes must:\n- Verify authentication state\n- Check user roles and permissions\n- Redirect unauthorized access\n- Handle loading states\n- Clear sensitive data on unmount\n- Update on auth state changes\n- Support role-based access control\n- Handle deep linking properly",
      "alwaysApply": true
    },
    {
      "description": "Form Validation Standards",
      "filePattern": "src/components/auth/**/*.tsx",
      "rule": "Authentication forms must:\n- Validate all inputs before submission\n- Show bilingual error messages\n- Implement proper password strength checks\n- Format phone numbers correctly\n- Handle submission states properly\n- Clear sensitive data after submission\n- Use proper ARIA attributes\n- Support keyboard navigation",
      "alwaysApply": true
    },
    {
      "description": "Language Context Usage",
      "filePattern": "src/store/LanguageContext.tsx",
      "rule": "Language context modifications require approval and must:\n- Maintain existing API compatibility\n- Support English and French only\n- Use proper TypeScript types\n- Handle edge cases gracefully\n- Maintain performance optimization\n- Support SSR if implemented\n- Handle loading states properly",
      "alwaysApply": true
    },
    {
      "description": "Incremental Development Approach",
      "filePattern": "src/**/*.{ts,tsx,js,jsx}",
      "rule": "Follow these guidelines for codebase modifications:\n- Before creating new components/files, verify they don't already exist\n- Update and enhance existing code rather than duplicating functionality\n- Build incrementally upon the current codebase with coherent changes\n- Avoid introducing redundant files or repeating previously fixed issues\n- Use consistent naming, formatting, and patterns as established in similar files\n- Create fallback mechanisms for problematic database structures\n- Document any workarounds with clear explanations and TODOs\n- Ensure changes are backward compatible with existing functionality\n- Test modifications against edge cases and error conditions",
      "alwaysApply": true
    },
    {
      "description": "Follow slot-based storage architecture",
      "filePattern": "src/(services|components|utils)/**/*.{ts,tsx}",
      "rule": "Use the dedicated slot-based storage system for product images. Ensure images are stored in `slot-{slotNumber}` folders. Utilize `slotStorage.ts` utilities for folder initialization and clearing. Extend `fileUpload.ts` for slot-aware uploads. Use `StorageInitializer` component for admin operations. Implement automatic cleanup when products are removed from slots.",
      "alwaysApply": true
    }
  ]
}
```

## Rule Categories

### TypeScript and Frontend

- **TypeScript Best Practices**: Ensure proper typing across the application
- **Bilingual Content Support**: Maintain English and French language support throughout
- **WhatsApp Integration**: Proper formatting and validation for WhatsApp numbers
- **Mobile-First Design**: Responsive design patterns optimized for mobile

### Database and Backend

- **Supabase Patterns**: Consistent data access through Supabase client
- **SQL Standards**: Proper naming, schema organization, and documentation
- **RLS Policies**: Granular security policies for data access control
- **Database Functions**: Security and optimization guidelines

### Core Application Concepts

- **25-Slot Model**: Maintain the core product slot structure
- **Error Handling**: Comprehensive error management
- **Image Optimization**: Performance techniques for product imagery
- **Database Schema Alignment**: Ensure frontend models match Supabase schema
- **Product Status Handling**: Properly display and filter by product status
- **Bilingual Data Support**: Handle English and French content fields
- **Analytics Tracking**: Track user interactions according to database structure
- **Seller Verification**: Display verification status badges based on database fields
- **Slot Storage**: Adhere to the `slot-{slotNumber}` folder structure and utilize dedicated utilities

### Data Model Integration

- **Users/Sellers**: Follow the database structure with proper WhatsApp validation
- **Products**: Support bilingual fields and maintain relationships to slots
- **Auction Slots**: Enforce the 25-slot model with proper active/inactive states
- **Delivery Options**: Implement all required fields with proper validation
- **Analytics Events**: Track user interactions in the format expected by the database

## Usage

These rules are enforced by Cursor AI to provide inline guidance and ensure consistent code practices throughout the SokoClick project. Rules marked as `alwaysApply: true` are enforced automatically, while others serve as contextual guidance when working with specific file types. 

## Frontend-Database Integration

When developing frontend components and services, always refer to the Supabase schema defined in `supabase/migrations/20240615120500_sokoclick_initial_schema.sql` to ensure strict alignment between frontend models and the database structure. This integration ensures data consistency, proper validation, and adherence to the business logic defined in the database schema.

## Architecture Patterns

### Repository Pattern

Clean separation between data access and business logic:
- Database operations are isolated in service methods
- Business rules are enforced at the service layer
- UI components don't directly access the database

### Hook Pattern

React hooks for data fetching and state management:
- Custom hooks encapsulate data access logic
- Components remain focused on presentation
- State management is standardized across the application

### Service Layer Pattern

Central service for all slot operations:
- All slot-related operations go through the `slotService`
- Validation and business rules are consistently applied
- Error handling is standardized

### Component Composition

Layered components from presentation to connected data:
- `SlotGrid` focuses on presentation
- `SlotGridConnected` handles data fetching
- `SlotManagement` provides complete workflow
- `StorageInitializer` manages slot storage setup

### Incremental Development

Cumulative approach to codebase modifications:
- Verify existence before creating new components/files
- Update and enhance instead of duplicating functionality
- Build coherently upon the current codebase
- Ensure backward compatibility with existing systems
- Document workarounds and edge case handling
- Implement fallback mechanisms for structural issues
- Follow established naming and formatting conventions
- Test against potential edge cases and error conditions

## Authentication Implementation Details

### Current Authentication Flow
1. User registration with email/password or phone
2. Password strength validation
3. Phone number validation for Cameroon format
4. Bilingual error handling
5. Session management with Supabase
6. Protected route implementation
7. Role-based access control

### Security Measures
- Password strength requirements
- Phone number validation
- Event tracking and logging
- Session management
- Secure data storage
- Input validation
- Error handling

### Modification Protocol
1. Submit detailed proposal
2. Security review
3. Impact assessment
4. Testing requirements
5. Approval from team lead
6. Implementation plan
7. Rollback plan

## Language System Implementation

### Current Implementation
- Custom LanguageContext
- English and French support
- Browser language detection
- localStorage persistence
- Fallback handling
- Type-safe translations

### Usage Requirements
1. Import useLanguage hook
2. Use t() function for translations
3. Provide both EN and FR texts
4. Follow type definitions
5. Handle loading states
6. Support SSR if needed

### Modification Protocol
1. Submit enhancement proposal
2. Impact assessment
3. Performance review
4. Testing requirements
5. Approval process
6. Implementation plan
7. Migration guide

## Testing Requirements

### Authentication Testing
- Unit tests for auth functions
- Integration tests for auth flow
- E2E tests for critical paths
- Security testing
- Performance testing
- Error handling tests
- Browser compatibility tests

### Language System Testing
- Unit tests for context
- Integration tests for components
- Loading state tests
- SSR compatibility tests
- Browser compatibility tests
- Performance impact tests

## Documentation Requirements

### Authentication Documentation
- Flow diagrams
- API documentation
- Security measures
- Error handling
- Testing guide
- Modification process
- Troubleshooting guide

### Language System Documentation
- Context usage guide
- Type definitions
- Best practices
- Performance considerations
- Testing guide
- Modification process
- Migration guide
