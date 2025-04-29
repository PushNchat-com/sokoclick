# SokoClick

SokoClick is a mobile-first ecommerce platform with 25 dedicated product slots, designed specifically for the Cameroonian market. The platform facilitates direct WhatsApp communication between buyers and sellers with a cash-on-delivery payment model.

## Overview

SokoClick provides a streamlined marketplace experience focused on mobile users in Cameroon. The platform features 25 permanent product slots, each capable of holding product information directly. This allows for easy discovery and inquiry about items via WhatsApp.

## Key Features

- **25 Dedicated Product Slots**: Fixed number of slots, each storing product details directly.
- **WhatsApp Integration**: Direct communication between buyers and sellers.
- **Bilingual Support**: Full English and French language support.
- **Mobile-First Design**: Optimized for smartphone users in Cameroon.
- **Cash on Delivery**: Simple payment model.
- **Seller Verification**: Trust-building verification system for sellers.
- **Admin Dashboard**: Comprehensive management tools for slots, users, and content.

## Tech Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Hosting**: Netlify with CI/CD
- **Image Optimization**: WebP format with responsive sizing
- **Monitoring**: Sentry integration (Planned/Optional)

## Installation

### Prerequisites
- Node.js (v16+)
- pnpm
- Supabase account
- Netlify account (for deployment)

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/PushNchat-com/sokoclick.git
cd sokoclick
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials (URL and Anon Key).

4. Start the development server
```bash
pnpm dev
```

## Project Structure

```
sokoclick/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── admin/     # Admin-specific components (Slot/User Management)
│   │   ├── product/   # Components for displaying slot content (Card, Details)
│   │   └── ui/        # Generic UI components
│   ├── hooks/         # Custom React hooks
│   ├── layouts/       # Page layout components
│   ├── pages/         # Application pages (Home, Admin, etc.)
│   ├── services/      # API and external service integrations (Supabase)
│   ├── store/         # State management
│   ├── styles/        # Global styles and Tailwind config
│   ├── types/         # TypeScript type definitions (incl. Supabase types)
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main application component
│   ├── main.tsx       # Application entry point (Vite)
│   └── routes.tsx     # Application routes (Example, adjust as needed)
├── supabase/          # Supabase configuration and migrations
├── .env.example       # Example environment variables
├── index.html         # HTML entry point
├── package.json       # Project dependencies
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

## User Types

### Buyers
- Browse products displayed in the 25 slots.
- View detailed product information shown in a slot.
- Contact sellers directly via WhatsApp (using number linked to the slot's seller).
- No account required.

### Sellers
- Provide product info & images to Admin via WhatsApp.
- Receive inquiries via their registered WhatsApp number.
- Complete verification process for trust-building.

### Administrators
- Manage content (draft & live) for all 25 product slots.
- Populate slot drafts based on seller submissions.
- Publish drafts to make content live in slots.
- Verify sellers.
- Monitor platform analytics.
- Configure platform settings.

## Deployment

The application is configured for deployment on Netlify with Supabase as the backend.

1. Configure Netlify deployment
```bash
pnpm build
```

2. Set up required environment variables in Netlify dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Enable continuous deployment from your repository.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

## Documentation

Additional documentation is available in the `sokoclick-docs` and `guides` directories:
- [Slot System Architecture](sokoclick-docs/slot-system-architecture.md)
- [Admin Dashboard Design](sokoclick-docs/dashboard/admin-dashboard-design.md)
- *(Review other docs for relevance)*
