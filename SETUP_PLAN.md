# SokoClick Implementation Plan

This document outlines the step-by-step implementation plan for launching SokoClick within 48 hours. The plan is divided into phases with specific tasks, commands, and configurations needed for successful implementation.

## Project Overview

SokoClick is a mobile-first ecommerce auction platform with 25 dedicated slots with permanent links. The platform will serve the Cameroonian market, supporting both English and French languages, with WhatsApp integration for communication and regional payment methods.

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
touch .env
```

Add the following to `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 1.3 - Netlify Setup
```bash
# Install Netlify CLI
pnpm install -g netlify-cli

# Initialize Netlify project
netlify init

# Configure Netlify build settings
touch netlify.toml
```

Add the following to `netlify.toml`:
```toml
[build]
  command = "pnpm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "pnpm run dev"
  port = 3000

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### 1.4 - Deploy Database Schema
-- Create schema for sokoclick

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  whatsapp_number TEXT NOT NULL, -- Required for communication
  language_preference TEXT DEFAULT 'en',
  location TEXT,
  role TEXT CHECK (role IN ('buyer', 'seller', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  payment_methods JSONB,
  notification_preferences JSONB
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  image_urls TEXT[],
  starting_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  auction_duration INTEGER,
  auction_end_time TIMESTAMPTZ,
  reserve_price NUMERIC,
  seller_whatsapp TEXT NOT NULL, -- Required for WhatsApp communication
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seller_id UUID REFERENCES users(id),
  shipping_options JSONB,
  condition TEXT,
  category TEXT
);

-- Auction slots table
CREATE TABLE auction_slots (
  id INTEGER PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,
  pricing_model TEXT CHECK (pricing_model IN ('free_with_commission', 'daily_fee', 'monthly_featured')),
  fee_amount NUMERIC, -- Amount paid for slot (if applicable)
  commission_percentage NUMERIC DEFAULT 10, -- Default 10% for free listing
  view_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT
);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  auction_slot_id INTEGER REFERENCES auction_slots(id),
  amount NUMERIC NOT NULL,
  time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'winning', 'outbid', 'rejected')),
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT,
  content_en TEXT,
  content_fr TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_product_id UUID REFERENCES products(id)
);

-- Transactions table to track the resolution process
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  commission_amount NUMERIC,
  status TEXT CHECK (status IN (
    'agreement_reached',  -- Buyer and seller agree on price
    'payment_pending',    -- Buyer needs to pay
    'payment_received',   -- Seller received payment
    'shipping_pending',   -- Seller needs to ship
    'shipped',            -- Product has been shipped
    'received',           -- Buyer received product
    'buyer_confirmed',    -- Buyer confirmed receipt
    'seller_paid',        -- Seller received payment
    'seller_confirmed',   -- Seller confirmed receipt
    'completed',          -- Transaction complete
    'disputed',           -- Issue with transaction
    'cancelled'           -- Transaction cancelled
  )),
  payment_method TEXT,
  whatsapp_thread_id TEXT, -- Reference to WhatsApp conversation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Initialize auction slots
INSERT INTO auction_slots (id, pricing_model, commission_percentage) VALUES 
  (1, 'free_with_commission', 10), (2, 'free_with_commission', 10), (3, 'free_with_commission', 10),
  (4, 'free_with_commission', 10), (5, 'free_with_commission', 10), (6, 'free_with_commission', 10),
  (7, 'free_with_commission', 10), (8, 'free_with_commission', 10), (9, 'free_with_commission', 10),
  (10, 'free_with_commission', 10), (11, 'free_with_commission', 10), (12, 'free_with_commission', 10),
  (13, 'free_with_commission', 10), (14, 'free_with_commission', 10), (15, 'free_with_commission', 10),
  (16, 'free_with_commission', 10), (17, 'free_with_commission', 10), (18, 'free_with_commission', 10),
  (19, 'free_with_commission', 10), (20, 'free_with_commission', 10), (21, 'free_with_commission', 10),
  (22, 'free_with_commission', 10), (23, 'free_with_commission', 10), (24, 'free_with_commission', 10),
  (25, 'free_with_commission', 10);

-- Create Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);
  
CREATE POLICY "Sellers can create products" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
  
CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view auction slots" ON auction_slots
  FOR SELECT USING (true);
  
CREATE POLICY "Only admins can update auction slots" ON auction_slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can place bids" ON bids
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can view their own bids" ON bids
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Transaction policies
CREATE POLICY "Buyers and sellers can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admin can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

Apply the migration:
```bash
supabase db reset
```

### Phase 2: Core Component Development (8 hours)

#### 2.1 - Project Structure Setup
```bash
# Create main directory structure
mkdir -p public/locales/{en,fr}
mkdir -p src/{api,assets/{images,icons},components/{layout,auction,auth,common,seller,admin},context,hooks,pages,services,styles,types,utils}

# Create placeholder files for key components
touch src/api/supabase.ts
touch src/context/AuthContext.tsx
touch src/components/layout/Header.tsx
touch src/components/layout/Footer.tsx
touch src/components/layout/Navigation.tsx
touch src/components/layout/LanguageSelector.tsx
touch src/pages/Home.tsx
touch src/pages/AuctionDetail.tsx
touch src/routes.tsx
touch src/App.tsx
```

#### 2.2 - Implement Supabase Client

Create `src/api/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

#### 2.3 - Setup i18n for Internationalization

```bash
# Install i18n packages
pnpm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
```

Create `src/utils/i18n.ts`:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'fr'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

#### 2.4 - Implement Authentication Context

Create `src/context/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../api/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 2.5 - Implement Basic Routing

```bash
# Install React Router
pnpm install react-router-dom
```

Create `src/routes.tsx`:
```typescript
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import AuctionDetail from './pages/AuctionDetail';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <NotFound />,
  },
  {
    path: '/sc/:slotId',
    element: <AuctionDetail />,
  },
]);

export default router;
```

Update `src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { AuthProvider } from './context/AuthContext';
import './utils/i18n';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
```

### Phase 3: Frontend Implementation (12 hours)

#### 3.1 - Implement Layout Components
Implement Header, Footer, Navigation, and LanguageSelector components based on the design templates.

#### 3.2 - Implement Auction Components
Create all auction-related components including:
- AuctionGrid.tsx
- AuctionSlot.tsx
- ProductCard.tsx
- CountdownTimer.tsx

#### 3.3 - Implement Authentication Components
- LoginForm.tsx
- RegisterForm.tsx
- ProfileManager.tsx

#### 3.4 - Implement Admin Components
- AdminDashboard.tsx
- SlotManager.tsx
- ProductApproval.tsx

#### 3.5 - Implement SEO Optimization for Permanent Slots
Create special meta tag components for each permanent slot to boost SEO.

### Phase 4: Edge Functions and Integrations (4 hours)
- Implement Supabase Edge Functions for auction lifecycle management
- Set up WhatsApp integration for communication
- Configure payment integration endpoints for regional payment methods

## Day 2 (Next 24 Hours)

### Phase 5: Testing and Debugging (8 hours)
- Test all core functionality
- Verify responsive design works across devices
- Test offline capabilities
- Debug and fix any issues

### Phase 6: Optimization (4 hours)
- Optimize images and assets
- Implement lazy loading
- Add caching strategies
- Configure Supabase Storage for optimized asset delivery
  - Set up proper CORS settings for asset access
  - Implement responsive image handling
  - Configure caching policies for static assets

### Phase 7: Content and Localization (4 hours)
- Create all translation files
- Add placeholder content for initial slots
- Set up SEO metadata

### Phase 8: Monitoring Setup (2 hours)
- Set up Sentry for error tracking
- Configure UptimeRobot for uptime monitoring
- Set up analytics tracking

### Phase 9: Deployment Preparation (2 hours)
- Final testing
- Documentation review
- Prepare production environment variables

### Phase 10: Launch (4 hours)
- Deploy to production
- Verify deployment
- Run post-launch checks
- Monitor system performance

## Progress Tracking Checklist

### Day 1
- [ ] Infrastructure Setup
  - [ ] Project Repository Setup
  - [ ] Supabase Setup
  - [ ] Netlify Setup
  - [ ] Database Schema Deployment
- [ ] Core Component Development
  - [ ] Project Structure Setup
  - [ ] Supabase Client Implementation
  - [ ] i18n Setup
  - [ ] Authentication Context
  - [ ] Basic Routing
- [ ] Frontend Implementation
  - [ ] Layout Components
  - [ ] Auction Components
  - [ ] Authentication Components
  - [ ] Admin Components
  - [ ] SEO Optimization
- [ ] Edge Functions and Integrations
  - [ ] Auction Lifecycle Management
  - [ ] WhatsApp Integration
  - [ ] Payment Integration

### Day 2
- [ ] Testing and Debugging
  - [ ] Core Functionality Testing
  - [ ] Responsive Design Testing
  - [ ] Offline Capability Testing
  - [ ] Issue Resolution
- [ ] Optimization
  - [ ] Image Optimization
  - [ ] Lazy Loading
  - [ ] Caching Implementation
  - [ ] Supabase Storage Configuration for CDN
- [ ] Content and Localization
  - [ ] Translation Files
  - [ ] Placeholder Content
  - [ ] SEO Metadata
- [ ] Monitoring Setup
  - [ ] Error Tracking
  - [ ] Uptime Monitoring
  - [ ] Analytics Setup
- [ ] Deployment Preparation
  - [ ] Final Testing
  - [ ] Documentation Review
  - [ ] Environment Variables
- [ ] Launch
  - [ ] Production Deployment
  - [ ] Deployment Verification
  - [ ] Post-Launch Checks
  - [ ] System Monitoring

## Netlify CI/CD Integration

1. Connect your GitHub repository to Netlify:
   - Log in to Netlify
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Select your sokoclick repository

2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Set environment variables (Supabase URL, Anon Key, etc.)

3. Set up branch deploys:
   - Enable branch deploys for testing features
   - Configure preview URLs

4. Configure custom domain:
   - Add sokoclick.com domain
   - Set up HTTPS
   - Configure DNS settings

## Post-Launch Tasks

1. **SEO Enhancement:**
   - Submit sitemap to search engines
   - Configure permanent slot URLs for maximum search visibility
   - Monitor search engine rankings

2. **Performance Monitoring:**
   - Review performance metrics
   - Optimize slow-loading areas
   - Enhance caching strategies

3. **User Feedback Collection:**
   - Implement feedback mechanisms
   - Address initial user issues
   - Plan iterative improvements 