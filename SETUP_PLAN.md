# SokoClick Implementation Plan

This document outlines the step-by-step implementation plan for launching SokoClick within 48 hours. The plan is divided into phases with specific tasks, commands, and configurations needed for successful implementation.

## Project Overview

SokoClick is a mobile-first ecommerce auction platform with 25 dedicated slots with permanent links. The platform will serve the Cameroonian market only, supporting both English and French languages, with WhatsApp integration for communication and payment on delivery methods only.

## Tech Stack

- **Frontend**: React with Vite, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime, Edge Functions)
- **Hosting**: Netlify with CI/CD integration
- **CDN**: Supabase Storage (utilizing its built-in CDN capabilities)
- **Monitoring**: Sentry, UptimeRobot

## Day 1 (First 24 Hours)

### Phase 1: Infrastructure Setup (4 hours)

#### 1.1 - Project Repository Setup
```bash
# Create a new repository on GitHub
# Clone the repository locally
git clone https://github.com/PushNchat-com/sokoclick.git
cd sokoclick

# Initialize React+Vite project with TypeScript and Tailwind CSS
pnpm create vite@latest . -- --template react-ts
pnpm install
pnpm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind CSS
# Edit tailwind.config.js to include the paths to all of your template files
```

#### 1.2 - Supabase Setup
```bash
# Install Supabase CLI
pnpm install -g supabase

# Initialize Supabase project
supabase init

# Start local Supabase development
supabase start

# Install Supabase client
pnpm install @supabase/supabase-js

# Create .env file for environment variables
touch .env .env.example
```

Add the following to `.env` and `.env.example` (with placeholder values in the example):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PUBLIC_URL=your_public_url
```

#### 1.3 - Netlify Setup
```bash
# Install Netlify CLI
pnpm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify project
netlify init

# Configure build settings in netlify.toml
touch netlify.toml
```

Add the following to `netlify.toml`:
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "16"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 1.4 - Deploy Database Schema
```bash
# Create database schema files
mkdir -p supabase/migrations
touch supabase/migrations/00001_initial_schema.sql
```

Add the following schema to `supabase/migrations/00001_initial_schema.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT CHECK (verification_level IN ('basic', 'complete')),
  verification_date TIMESTAMP WITH TIME ZONE,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('XAF', 'FCFA')),
  image_urls TEXT[] NOT NULL,
  category TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'refurbished')),
  seller_id UUID REFERENCES users(id),
  seller_whatsapp TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  auction_slot_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction slots table
CREATE TABLE auction_slots (
  id INTEGER PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery options table
CREATE TABLE delivery_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  areas TEXT[],
  estimated_days INTEGER NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product attributes table
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize 25 slots
INSERT INTO auction_slots (id, is_active, created_at, updated_at)
SELECT i, FALSE, NOW(), NOW()
FROM generate_series(1, 25) AS i;

-- Create admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_moderator', 'analytics_viewer', 'customer_support')),
  permissions TEXT[],
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public access for reading products and slots
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can view auction slots"
  ON auction_slots FOR SELECT
  USING (true);

-- RLS for admins
CREATE POLICY "Admins can do everything"
  ON users FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Admins can do everything"
  ON products FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Admins can do everything"
  ON auction_slots FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Admins can do everything"
  ON delivery_options FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Admins can do everything"
  ON product_attributes FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- Create analytics table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  slot_id INTEGER,
  product_id UUID,
  user_id UUID,
  whatsapp_contact BOOLEAN DEFAULT FALSE,
  language TEXT CHECK (language IN ('en', 'fr')),
  device_type TEXT,
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions for analytics
CREATE OR REPLACE FUNCTION increment_slot_view_count(slot_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE auction_slots
  SET view_count = view_count + 1
  WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql;
```

```bash
# Apply migrations
supabase db reset

# Verify schema
supabase db dump -f schema-verification.sql
```

### Phase 2: Core Component Development (8 hours)

#### 2.1 - Project Structure Setup
```bash
# Create main directory structure
mkdir -p src/components/admin src/components/product src/components/ui
mkdir -p src/hooks src/layouts src/pages src/services src/store src/styles src/types src/utils
mkdir -p public/icons

# Create type definitions
touch src/types/index.ts
```

Add the following to `src/types/index.ts`:
```typescript
// Product and slot types
export interface Product {
  id: string;
  slotNumber: number;
  title: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  price: number;
  currency: 'XAF' | 'FCFA';
  images: string[];
  mainImage: string;
  additionalImages?: string[];
  listingTime: {
    startTime: string; // ISO date string
    endTime: string;   // ISO date string
  };
  seller: {
    name: string;
    whatsappNumber: string;
    location: string;
    image?: string;
    isVerified: boolean;
    verificationLevel?: 'basic' | 'complete';
    verificationDate?: string;
    joinedDate: string;
  };
  category?: string;
  condition?: 'new' | 'used' | 'refurbished';
  delivery?: {
    options: {
      name: { en: string; fr: string; };
      areas: string[];
      estimatedDays: number;
      fee: number;
    }[];
    note?: {
      en: string;
      fr: string;
    };
  };
  attributes?: {
    name: string;
    value: string;
  }[];
}

// Additional types for components here...
```

#### 2.2 - UI Components
```bash
# Create base UI components
touch src/components/ui/Button.tsx
touch src/components/ui/Card.tsx
touch src/components/ui/Modal.tsx
touch src/components/ui/Skeleton.tsx
touch src/components/ui/Icons.tsx

# Create product components based on design docs
touch src/components/product/ProductCard.tsx
touch src/components/product/ProductDetails.tsx
touch src/components/product/ImageGallery.tsx
touch src/components/product/WhatsAppButton.tsx
touch src/components/product/EmptySlotCard.tsx

# Create admin components
touch src/components/admin/SlotGrid.tsx
touch src/components/admin/ProductForm.tsx
touch src/components/admin/UserManagement.tsx
touch src/components/admin/SlotManagement.tsx
touch src/components/admin/DashboardMetrics.tsx
```

#### 2.3 - Page Components
```bash
# Create main page components
touch src/pages/HomePage.tsx
touch src/pages/ProductPage.tsx
touch src/pages/AdminDashboard.tsx
touch src/pages/AdminLogin.tsx
touch src/pages/NotFound.tsx

# Create layout components
touch src/layouts/MainLayout.tsx
touch src/layouts/AdminLayout.tsx

# Create routing
touch src/routes.tsx
```

#### 2.4 - Supabase Services
```bash
# Create service files
touch src/services/supabase.ts
touch src/services/products.ts
touch src/services/slots.ts
touch src/services/users.ts
touch src/services/analytics.ts
```

Add the following to `src/services/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 2.5 - State Management
```bash
# Create state management files
touch src/store/language.ts
touch src/store/auth.ts
touch src/store/products.ts
```

### Phase 3: MVP Implementation (12 hours)

#### 3.1 - Product Card Implementation
Implement the product card component according to the design document, focusing on:
- Responsive layout for mobile/tablet/desktop
- WhatsApp integration
- Time remaining calculation
- Image optimization
- Payment method badge
- Seller verification badge

#### 3.2 - Home Page Grid Implementation
Implement the home page grid with:
- Responsive layout for 25 slots
- Sorting functionality
- Basic filtering
- Skeleton loading states
- Empty slot treatment

#### 3.3 - Product Details Page
Implement the product details page with:
- Image gallery with full-screen capability
- WhatsApp contact button
- Payment method information
- Seller verification details
- Delivery information
- Time remaining indication

#### 3.4 - Admin Dashboard MVP Features
Implement the critical admin features:
- Product creation with WhatsApp integration
- Slot management grid
- Basic user management
- WhatsApp number validation

## Day 2 (Second 24 Hours)

### Phase 4: Refinement and Testing (8 hours)

#### 4.1 - Responsive Testing
Test the application on:
- Mobile devices (various screen sizes)
- Tablets
- Desktop browsers
- Slow network conditions

#### 4.2 - WhatsApp Integration Testing
Verify:
- WhatsApp links open correctly
- Pre-populated messages include correct product references
- WhatsApp number validation works properly
- Test on both Android and iOS devices

#### 4.3 - Bilingual Support Testing
Test:
- Language switching functionality
- All UI elements in both English and French
- Proper text expansion/contraction in layouts
- Dynamic content translation

#### 4.4 - Performance Optimization
Implement:
- Image lazy loading
- Code splitting for admin dashboard
- Progressive loading strategies
- Memoization of expensive calculations

### Phase 5: Admin Dashboard Enhancement (8 hours)

#### 5.1 - Product Management
Enhance:
- Product approval workflow
- Batch operations
- Image moderation tools
- WhatsApp validation tools

#### 5.2 - User Verification
Implement:
- Seller verification process
- Verification badge management
- WhatsApp number verification
- Verification level assignment

#### 5.3 - Analytics Implementation
Create:
- Basic dashboard metrics
- Slot performance tracking
- WhatsApp conversion analytics
- User activity monitoring

### Phase 6: Final Deployment and Documentation (8 hours)

#### 6.1 - Production Deployment
```bash
# Build for production
pnpm build

# Deploy to Netlify
netlify deploy --prod

# Apply final database migrations
supabase db push
```

#### 6.2 - Monitoring Setup
```bash
# Install Sentry
pnpm add @sentry/react @sentry/tracing

# Configure Sentry in main.tsx
```

#### 6.3 - Documentation Finalization
Complete:
- README.md with detailed setup instructions
- User documentation for admin dashboard
- API documentation for future extensions
- Handover documentation for maintainers

#### 6.4 - Launch Checklist
Verify:
- All 25 slots are correctly set up
- Admin accounts are created
- WhatsApp integration is fully functional
- Bilingual content is complete
- SEO tags are properly configured
- SSL certificate is valid
- Error tracking is operational

## Post-Launch (First Week)

### Daily Monitoring
- Track user engagement metrics
- Monitor WhatsApp button clicks
- Identify and fix any emerging issues
- Gather user feedback
- Analyze product slot performance

### Quick Iterations
- Address priority bugs within 24 hours
- Implement minor UX improvements based on feedback
- Optimize image loading for slower connections
- Fine-tune admin workflow based on actual usage

### Documentation Updates
- Update documentation based on real-world usage
- Document common admin procedures
- Create troubleshooting guide
- Record standard operating procedures for platform management