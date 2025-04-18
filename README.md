# sokoclick
SokoClick is a specialized mobile-first ecommerce auction platform designed to host a limited  number of concurrent product auctions. 

## 1. Project Overview

SokoClick is a specialized mobile-first ecommerce auction platform designed to host a limited number of concurrent product auctions. The platform features 25 dedicated "slots" with permanent links, where products rotate based on seller uploads (and Admin Approval) and auction durations managed by the administrator. The primary goal is to create a sense of exclusivity and urgency for buyers while simplifying the selling process for vendors.

SokoClick will primarily serve the Cameroonian market, supporting both English and French as official languages, with considerations for local payment methods, connectivity challenges, and regional user behaviors.

**Business Model:**
- Seller list products for free and pays 10% commission on sales
- Seller pays $5 daily listing fee per slot = pays 00 commission on sales
- Seller pays $140 for a featured slot per month = pays 00 commission on sales 
- 100% WhatsApp Business API for communication
- 100% Supabase for backend services
- 100% Vercel for frontend hosting

**Resolution process between buyers and sellers:**
- Buyer and seller agree on the price of the product via WhatsApp 
- Buyer pays for the product
- Seller receives payment
- Seller ships the product
- Buyer receives the product
- Buyer confirms receipt of the product
- Seller receives payment of the product
- Seller confirms receipt of payment
- Transaction is complete 

Sellers can list products for free and pay $5 daily listing fee per slot = pays 00 commission on sales
Buyers can bid on products via whatsapp with the seller and pay for the product via MTN Mobile Money, Orange Money, or other regional payment providers
Seller must have an account to list products and receive payments
Buer must not have an account to bid on products 

Sellers onboarding process:
- Seller provides their name, phone number, and WhatsApp number
- Seller provides product details
- Seller provides payment details
- Seller is added to the platform

## 2. Technical Architecture

SokoClick will utilize a modern web architecture leveraging the following technologies:

### Frontend:
* **Framework:** React with Vite for fast development and build times
* **Language:** TypeScript for enhanced code maintainability and type safety
* **UI Library:** Tailwind CSS for consistent styling and responsive components
* **Internationalization:** React-i18next for multilingual support (English/French)
* **State Management:** React Context API with hooks for application state
* **Offline Support:** Service workers for core functionality during connectivity issues

### Backend:
* **Platform:** Supabase, providing a comprehensive suite of backend services including:
  * **Database:** PostgreSQL for storing application data
  * **Authentication:** For securing user access (buyers, sellers, and admins)
  * **Storage:** For hosting product images with optimization for low-bandwidth environments
  * **Realtime:** For implementing live auction updates and notifications
  * **Edge Functions:** For server-side logic beyond Supabase's built-in features
  * **Row-Level Security:** For enforcing data access controls

### Third-Party Integrations:
* **Payment Processing:** Integration with MPesa, Orange Money, and other regional payment providers
* **Messaging:** WhatsApp Business API for buyer-seller communication
* **Analytics:** Google Analytics and Supabase Analytics for user behavior tracking
* **CDN:** Cloudflare for optimized content delivery

## 3. Frontend Implementation

### Component Structure:
* **Layout Components:**
  * Responsive grid layout for the 25 auction slots
  * Language selector component (EN/FR toggle)
  * Navigation and user profile components
  * Filter and sort controls

**The section component includes:**
**Navigation Bar:**
Logo with the SokoClick branding
Navigation links: "How It Works," "Get Help," and "Start Selling"
Login and Sign Up buttons
Language toggle (EN/FR)
User menu icon

**Dynamic Hero Slider:**
Three rotating slides with compelling messaging:

"Discover Exclusive Sales" - Highlights the marketplace value
"Turn Products Into Profit" - Appeals to potential sellers

**"Direct Connection, Real Deals"** - Emphasizes the WhatsApp integration
Interactive navigation with dots and arrow controls
Auto-advancing slides (every 5 seconds)
Clear call-to-action buttons on each slide

**Benefits Section:**
Three key value propositions with icons
Focuses on exclusive products, seller verification, and direct communication
Clean, visual presentation that complements the auction listings below


* **Auction Slot Component:**
  * Fetches and displays current product assigned to its permanent link
  * Renders product details in user's preferred language
  * Implements countdown timer with color changes (green > 10 hours, red < 10 hours)
  * Provides bid mechanism and WhatsApp contact button
  * Handles loading states and offline fallbacks

* **User Authentication Components:**
  * Registration and login forms for buyers and sellers
  * Social login options popular in Cameroon
  * Password reset and account management

### UI/UX Considerations:
* **Mobile-First Design:**
  * Touch-optimized interfaces
  * Optimized image loading for variable connection speeds
  * Reduced data consumption options
  * Portrait and landscape orientations support

* **Accessibility:**
  * WCAG 2.1 AA compliance
  * Screen reader compatibility
  * High contrast mode
  * Keyboard navigation

* **Offline Experience:**
  * Cached viewing of previously loaded auctions
  * Offline bid queuing for synchronization when connection is restored
  * Visual indicators for offline status

## 4. Backend Implementation (Supabase)

### Database Schema:

#### `users`:
* `id` (UUID, primary key)
* `email` (text, unique)
* `phone_number` (text)
* `whatsapp_number` (text)
* `language_preference` (text, default: 'en')
* `location` (text)
* `role` (text: 'buyer', 'seller', 'admin')
* `created_at` (timestamp with time zone)
* `last_login` (timestamp with time zone)
* `payment_methods` (jsonb)
* `notification_preferences` (jsonb)

#### `products`:
* `id` (UUID, primary key)
* `name_en` (text, not null)
* `name_fr` (text, not null)
* `description_en` (text)
* `description_fr` (text)
* `image_urls` (text[], array of URLs from Supabase Storage)
* `starting_price` (numeric, not null)
* `currency` (text, default: 'XAF')
* `auction_duration` (integer, in hours)
* `auction_end_time` (timestamp with time zone)
* `reserve_price` (numeric, nullable)
* `seller_whatsapp` (text)
* `created_at` (timestamp with time zone)
* `seller_id` (UUID, foreign key referencing users.id)
* `shipping_options` (jsonb)
* `condition` (text)
* `category` (text)

#### `auction_slots`:
* `id` (integer, primary key, 1-25)
* `product_id` (UUID, foreign key referencing products.id, nullable if slot is empty)
* `is_active` (boolean, default: false)
* `start_time` (timestamp with time zone)
* `end_time` (timestamp with time zone)
* `featured` (boolean, default: false)
* `view_count` (integer, default: 0)

#### `bids`:
* `id` (UUID, primary key)
* `user_id` (UUID, foreign key referencing users.id)
* `product_id` (UUID, foreign key referencing products.id)
* `auction_slot_id` (integer, foreign key referencing auction_slots.id)
* `amount` (numeric, not null)
* `time` (timestamp with time zone)
* `status` (text: 'active', 'winning', 'outbid', 'rejected')
* `notification_sent` (boolean, default: false)

#### `notifications`:
* `id` (UUID, primary key)
* `user_id` (UUID, foreign key referencing users.id)
* `type` (text: 'outbid', 'auction_ending', 'auction_won', etc.)
* `content_en` (text)
* `content_fr` (text)
* `read` (boolean, default: false)
* `created_at` (timestamp with time zone)
* `related_product_id` (UUID, foreign key referencing products.id, nullable)

### API Endpoints:

#### Public Endpoints:
* `GET /api/slots` - Fetch all active auction slots
* `GET /api/slots/:id` - Fetch details for a specific auction slot
* `GET /api/products/:id` - Fetch product details
* `GET /api/products/:id/bids` - Fetch bid history for a product

#### Authenticated Endpoints:
* `POST /api/bids` - Place a bid on a product
* `POST /api/products` - Create a new product listing (sellers only)
* `GET /api/users/me/bids` - Fetch user's bid history
* `PUT /api/users/me` - Update user profile
* `GET /api/notifications` - Get user notifications

#### Admin Endpoints:
* `PUT /api/slots/:id` - Assign product to auction slot
* `GET /api/admin/products` - Fetch all products for approval
* `PUT /api/admin/products/:id` - Approve/reject product listing
* `GET /api/admin/analytics` - Fetch platform analytics

### Database Policies:
* Products are visible to all users, but creation requires seller authentication
* Bids can only be created and viewed by authenticated users
* Users can only modify their own profile data
* Admin-only tables and functions are restricted with row-level security

## 5. Multilingual Support

### Implementation Strategy:
* All user-facing content stored in both English and French in the database
* React-i18next for frontend text translation
* Language detection based on browser settings with manual override
* Dedicated translation files for UI elements
* Server-side content delivery in the user's preferred language

### Content Management:
* Admin interface for managing translations
* Validation to ensure all content has both language versions
* Fallback mechanisms if translation is missing

## 6. Payment Processing

### Supported Payment Methods:
* MPesa
* Orange Money
* Mobile Money
* Bank transfers (for higher-value items)
* Cash on delivery (where applicable)

### Payment Flow:
1. Buyer selects payment method during bid/purchase
2. SokoClick generates payment request to appropriate provider
3. User completes payment on provider platform/app
4. Provider sends confirmation webhook to SokoClick
5. SokoClick verifies payment and updates bid/purchase status
6. Notification sent to buyer and seller

### Security Considerations:
* PCI DSS compliance for payment handling
* Encryption for all payment data in transit and at rest
* Secure webhook validation
* Payment reconciliation process

## 7. Auction Mechanism

### Product Lifecycle:
1. **Seller Upload:** Seller submits product details in both languages
2. **Admin Review:** Administrator approves product listing
3. **Slot Assignment:** Admin assigns product to available auction slot
4. **Active Auction:** Product appears in designated slot with countdown timer
5. **Bidding Period:** Users place bids via the platform
6. **Auction End:** Timer expires, highest bid wins (if above reserve)
7. **Transaction:** Buyer and seller connect via WhatsApp to complete transaction
8. **Feedback:** Both parties can provide ratings/feedback

**Listing Mechanism:** Rotating Products on Permanent Links

*Dedicated Slots:* The core of the platform revolves around 25 pre-defined auction slots. Each slot will have a unique and permanent URL (e.g., https://sokoclick.com/sc/1, https://sokoclick.com/sc/2, ..., https://sokoclick.com/sc/25).
Admin Product Assignment: The administrator will be responsible for assigning uploaded products to these available slots. This assignment will involve updating the auction_slots table with the product_id of the product to be featured in that slot.

*Auction Lifecycle:* When a product is assigned to a slot, the is_active flag in auction_slots will be set to true, and the start_time and end_time will be calculated based on the auction_duration provided by the seller.
Frontend Display Logic: The frontend will fetch data from the auction_slots table. For each slot where is_active is true, it will then fetch the corresponding product details from the products table using the product_id. If is_active is false or product_id is null, the slot can display a placeholder or indicate that it's currently empty.

*### Timer Behavior:*
* Green display when more than 10 hours remain
* Red display when less than 10 hours remain
* Accurate countdown synchronized with server time
* Grace period for last-minute bids (extends auction by 5 minutes)

## 8. Admin Functionality

### Dashboard Features:
* Overview of platform metrics (active auctions, users, bids)
* Product approval queue
* Auction slot management interface
* User management and moderation tools
* Sales and revenue reports
* Platform configuration settings

### Auction Management:
* Drag-and-drop interface for assigning products to slots
* Bulk action capabilities for approving multiple products
* Ability to feature specific auctions in prominent positions
* Tools for extending or ending auctions manually if needed
* Blacklist management for problematic users or products

## 9. Security Implementation

### Authentication:
* Email/password with strong password requirements
* Two-factor authentication via authenticator apps (preferred) or SMS
* Social login with security verification
* Session management with automatic timeouts

### Data Protection:
* Encryption for sensitive data
* GDPR and local data protection law compliance
* Data retention policies (automated deletion of unnecessary data)
* Privacy controls for user information

### Threat Protection:
* Rate limiting to prevent brute force attacks
* SQL injection prevention
* XSS protection
* CSRF token implementation
* Regular security audits and penetration testing

## 10. Analytics and Reporting

### Data Collection:
* User behavior tracking (page views, time spent, interactions)
* Auction performance metrics
* Conversion rates and funnel analysis
* Search and navigation patterns
* Device and location data

### Reporting Features:
* Real-time dashboard for administrators
* Scheduled reports via email
* Exportable data in multiple formats
* Custom report generation
* Anomaly detection for fraud prevention

## 11. Performance Optimization

### Caching Strategy:
* Browser caching for static assets
* Redis caching for frequent database queries
* CDN caching for images and static content
* Cache invalidation on data updates

### Image Optimization:
* Responsive images with multiple resolutions
* Progressive loading for better perceived performance
* WebP format with fallbacks
* Lazy loading for off-screen content
* Image compression optimized for mobile networks

### API Optimization:
* Pagination for large data sets
* Query optimization for database performance
* Response compression
* GraphQL consideration for future implementations to reduce over-fetching

## 12. Testing Strategy

### Testing Levels:
* **Unit Testing:** Jest for component and function testing
* **Integration Testing:** Testing Library for component interaction
* **E2E Testing:** Cypress for full user flow testing
* **Performance Testing:** Lighthouse and custom load testing
* **Accessibility Testing:** axe-core for WCAG compliance
* **Internationalization Testing:** Verify all content in both languages

### Testing Infrastructure:
* Automated testing in CI/CD pipeline
* Visual regression testing
* Mock services for external dependencies
* Test coverage reporting

## 13. Deployment and DevOps

### Infrastructure:
* Vercel or Netlify for frontend hosting
* Supabase for backend services
* Cloudflare for CDN and security
* Containerization with Docker for custom services

### CI/CD Pipeline:
* GitHub Actions for automated builds and deployments
* Environment-specific configuration management
* Automated testing before deployment
* Rollback capabilities for failed deployments

### Monitoring:
* Real-time error tracking with Sentry
* Performance monitoring with New Relic
* Uptime monitoring with UptimeRobot
* Log aggregation and analysis

## 14. Mobile Considerations

### Network Resilience:
* Reduced payload sizes for slower connections
* Retry mechanisms for failed requests
* Background synchronization when connection improves
* Bandwidth detection and adaptive content delivery

### Offline Capabilities:
* Service worker implementation for core functionality
* Offline data storage with IndexedDB
* Queue system for actions performed offline
* Clear visual indicators of offline status

## 15. Future Roadmap Considerations

### Potential Enhancements:
* Native mobile applications for Android/iOS
* Integration with social media platforms for sharing
* Enhanced analytics and recommendation system
* Expanded payment options
* Direct in-app messaging system
* Loyalty program for frequent buyers/sellers
* API for third-party integrations

## 16. Appendix

### Glossary of Terms:
* **Auction Slot:** One of the 25 permanent positions on the platform
* **Reserve Price:** Minimum acceptable selling price set by seller
* **Bid:** Offer made by a potential buyer
* **Featured Auction:** Prominently displayed auction slot

### Technical Dependencies:
* React 18+
* TypeScript 4.5+
* Tailwind CSS 3+
* React Router 6+
* React-i18next 12+
* Supabase JS Client
* Day.js for time handling
* React Query for data fetching

Project Timeline:
- 14/04/2025: Project started
- 15/04/2025: Project completed
- 48 hours to complete the project

### Resources:
* Supabase Documentation: https://supabase.io/docs
* React Documentation: https://reactjs.org/docs
* Tailwind CSS Documentation: https://tailwindcss.com/docs
* i18next Documentation: https://www.i18next.com

This document provides a comprehensive technical overview of the SokoClick project. Implementation details may require adjustment during development based on specific requirements and constraints.

## 17. Project Directory Structure

```
sokoclick/
├── .github/                       # GitHub workflows and configuration
│   └── workflows/                 # CI/CD workflows
├── public/                        # Static files
│   ├── locales/                   # Translation files
│   │   ├── en/                    # English translations
│   │   └── fr/                    # French translations
│   │   
│   ├── favicon.ico
│   └── robots.txt
├── src/                           # Frontend source code
│   ├── api/                       # Supabase API integration
│   │   ├── supabase.ts            # Supabase client setup and configuration
│   │   ├── products.ts            # Product-related Supabase queries
│   │   ├── auctions.ts            # Auction-related Supabase queries
│   │   ├── users.ts               # User-related Supabase queries
│   │   ├── bids.ts                # Bidding-related Supabase queries
│   │   └── notifications.ts       # Notification-related Supabase queries
│   ├── assets/                    # Static assets
│   │   ├── images/                # Image assets
│   │   └── icons/                 # Icon assets
│   │   
│   ├── components/                # Reusable components
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.tsx         # Site header
│   │   │   ├── Footer.tsx         # Site footer
│   │   │   ├── Navigation.tsx     # Navigation component
│   │   │   └── LanguageSelector.tsx # Language toggle component
│   │   ├── auction/               # Auction-specific components
│   │   │   ├── AuctionGrid.tsx    # Grid of auction slots
│   │   │   ├── AuctionSlot.tsx    # Individual auction slot
│   │   │   ├── ProductCard.tsx    # Product display card
│   │   │   ├── BidHistory.tsx     # Bid history display
│   │   │   ├── CountdownTimer.tsx # Auction countdown timer
│   │   │   └── FeaturedAuction.tsx # Featured auction display
│   │   ├── auth/                  # Authentication components
│   │   │   ├── LoginForm.tsx      # Login form
│   │   │   ├── RegisterForm.tsx   # Registration form
│   │   │   └── ProfileManager.tsx # User profile management
│   │   ├── common/                # Common UI components
│   │   │   ├── Button.tsx         # Custom button component
│   │   │   ├── Modal.tsx          # Modal dialog component
│   │   │   ├── Loader.tsx         # Loading indicator
│   │   │   ├── ErrorBoundary.tsx  # Error handling component
│   │   │   └── Notification.tsx   # Notification component
│   │   ├── seller/                # Seller-specific components
│   │   │   ├── ProductForm.tsx    # Product creation/edit form
│   │   │   ├── SellerDashboard.tsx # Seller dashboard
│   │   │   └── ProductList.tsx    # Seller's product list
│   │   └── admin/                 # Admin components
│   │       ├── AdminDashboard.tsx # Admin dashboard
│   │       ├── SlotManager.tsx    # Auction slot management
│   │       ├── ProductApproval.tsx # Product approval interface
│   │       └── UserManagement.tsx # User management interface
│   ├── context/                   # React context providers
│   │   ├── AuthContext.tsx        # Authentication context using Supabase Auth
│   │   ├── I18nContext.tsx        # Internationalization context
│   │   ├── NotificationContext.tsx # Notification context
│   │   └── ThemeContext.tsx       # Theme/appearance context
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Supabase authentication hook
│   │   ├── useAuction.ts          # Supabase auction data hook
│   │   ├── useProducts.ts         # Supabase products data hook
│   │   ├── useBids.ts             # Supabase bidding functionality hook
│   │   └── useOffline.ts          # Offline detection hook
│   ├── pages/                     # Application pages
│   │   ├── Home.tsx               # Homepage
│   │   ├── AuctionDetail.tsx      # Individual auction page
│   │   ├── ProductDetail.tsx      # Product details page
│   │   ├── UserProfile.tsx        # User profile page
│   │   ├── SellerDashboard.tsx    # Seller dashboard page
│   │   ├── AdminDashboard.tsx     # Admin dashboard page
│   │   ├── Authentication.tsx     # Login/registration page
│   │   └── NotFound.tsx           # 404 page
│   ├── services/                  # Frontend services
│   │   ├── storage.ts             # Local storage service
│   │   ├── analytics.ts           # Analytics service
│   │   ├── payments.ts            # Payment integration service
│   │   └── notifications.ts       # Local notification service
│   ├── styles/                    # Global styles
│   │   ├── globals.css            # Global CSS
│   │   └── tailwind.css           # Tailwind entry point
│   ├── types/                     # TypeScript type definitions
│   │   ├── supabase.ts            # Generated Supabase types
│   │   ├── user.ts                # User-related types
│   │   ├── product.ts             # Product-related types
│   │   ├── auction.ts             # Auction-related types
│   │   └── api.ts                 # API response types
│   ├── utils/                     # Utility functions
│   │   ├── date.ts                # Date formatting utilities
│   │   ├── currency.ts            # Currency formatting utilities
│   │   ├── validation.ts          # Form validation utilities
│   │   ├── i18n.ts                # Internationalization setup
│   │   └── supabase.ts            # Supabase utility helpers
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   ├── routes.tsx                 # Route definitions
│   └── vite-env.d.ts              # Vite environment definitions
├── supabase/                      # Supabase configuration (for local dev and migrations)
│   ├── migrations/                # Database migrations
│   │   ├── 20240414000000_initial_schema.sql  # Initial schema setup
│   │   └── 20240414000001_seed_data.sql       # Initial data seeding
│   ├── functions/                 # Supabase Edge Functions
│   │   ├── auction-end/           # Function to handle auction ending
│   │   ├── payment-webhook/       # Payment processing webhooks
│   │   └── notification-sender/   # Function to send notifications
│   ├── triggers/                  # Supabase database triggers
│   ├── seed.sql                   # Initial database seed data
│   └── config.toml                # Supabase local configuration
├── .env.example                   # Example environment variables
├── .eslintrc.js                   # ESLint configuration
├── .gitignore                     # Git ignore file
├── .prettierrc                    # Prettier configuration
├── index.html                     # HTML entry point
├── package.json                   # NPM package configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite configuration
```

This directory structure is optimized for a Supabase backend architecture, with the frontend built using React/Vite. All backend functionality (database, authentication, storage, and realtime features) will be handled through Supabase, eliminating the need for a separate backend codebase. The frontend code is organized to efficiently interact with Supabase services while maintaining clean separation of concerns.

## 18. Production Readiness Checklist

```
### Pre-Launch Checklist
□ Database schema finalized and indexed appropriately
□ Supabase RLS policies thoroughly tested
□ All API endpoints secured with proper authentication
□ Rate limiting implemented for all public endpoints
□ Two-factor authentication tested on all supported devices
□ Image optimization pipeline confirmed working
□ Translation files complete for both English and French
□ SSL/TLS certificates configured
□ DNS settings configured with appropriate TTL
□ CDN properly configured for static assets
□ Error logging and monitoring set up
□ Payment processing webhooks tested with all supported providers
□ Backup and recovery procedures documented and tested
□ Performance testing completed under expected load
□ Accessibility compliance verified (WCAG 2.1 AA)

### Post-Launch Monitoring
□ Set up real-time error tracking with Sentry
□ Configure performance monitoring with New Relic
□ Implement uptime monitoring with UptimeRobot
□ Schedule regular security scans and audits
□ Configure automated database backups
□ Set up alerts for abnormal system behavior
□ Implement analytics tracking for key user journeys
□ Create dashboards for key business metrics
```

## 19. Contingency Plans

### System Outages
- **Database Unavailability**: Implement read-only mode with cached data
- **CDN Disruption**: Fallback to direct asset serving with reduced image quality
- **Payment Gateway Issues**: Provide alternative payment methods

### Security Incidents
- **Data Breach Response Plan**: Documentation of steps to take in case of a data breach
- **Account Compromise**: Automated account locking and recovery procedures
- **Fraud Detection**: Systems to identify and prevent fraudulent activities

### Business Continuity
- **Disaster Recovery Plan**: Procedures for full system recovery
- **Communication Strategy**: Templates for communicating with users during incidents
- **Service Level Objectives**: Defined recovery time and point objectives (RTO/RPO)

## Current Implementation Status

### Frontend Infrastructure
- [x] Project Repository Setup
- [x] Basic React/TypeScript/Vite configuration
- [x] Tailwind CSS integration
- [x] i18n setup for English/French
- [x] Basic routing with React Router
- [x] Authentication context with Supabase
- [ ] Comprehensive route protection

### Core Components
- [x] Layout components (Header, Footer)
- [x] AuctionCard component
- [x] LazyImage with error handling
- [x] Skeleton loading components
- [x] Error boundaries
- [x] Infinite scrolling hooks
- [ ] WhatsApp integration and tracking
- [ ] Payment processing UI

### Pages
- [x] Homepage with auction grid
- [x] Auction detail page
- [x] Error page
- [ ] User profile page
- [ ] Admin dashboard
- [ ] Seller dashboard

### Backend (Supabase)
- [x] Database schema creation
- [x] Basic RLS policies
- [ ] Edge Functions for business logic
- [ ] Webhook handlers for external services
- [ ] Advanced RLS for multi-role permissions

### Deployment
- [ ] CI/CD setup
- [ ] Production environment configuration
- [ ] CDN optimization
- [ ] Monitoring and error tracking

## Supabase MCP Integration

This project supports the Model Context Protocol (MCP) for AI-assisted development with Supabase. This allows AI tools like Cursor to interact directly with your Supabase database.

### Setup

1. Create a personal access token in your [Supabase dashboard](https://app.supabase.com) (Profile > Access Tokens)
2. Replace `<personal-access-token>` in `.cursor/mcp.json` with your token
3. Open the project in Cursor and verify the MCP connection in Settings > MCP

### Usage

With MCP configured, you can ask your AI assistant to:

- Query your Supabase database ("Show me all auction slots in the database")
- Help with schema design ("How should I structure the relationship between users and products?")
- Generate database queries ("Write a query to find all products with bids above X")
- Troubleshoot database issues ("Why isn't this data showing up in my frontend?")

### Security Notes

- Use a token with appropriate permissions (read-only for querying, read-write for modifications)
- Never commit the token to version control (the file with your token is already in .gitignore)
- Regularly rotate your access tokens
- Consider using a dedicated token for MCP that can be revoked if needed
