# SokoClick

SokoClick is a mobile-first ecommerce platform with 25 dedicated product slots, designed specifically for the Cameroonian market. The platform facilitates direct WhatsApp communication between buyers and sellers with a cash-on-delivery payment model.

## Overview

SokoClick provides a streamlined marketplace experience focused on mobile users in Cameroon. The platform features 25 permanent product slots with dedicated URLs, making it easy for sellers to market their products and for buyers to discover and inquire about items via WhatsApp.

## Key Features

- **25 Dedicated Product Slots**: Fixed number of slots with permanent links
- **WhatsApp Integration**: Direct communication between buyers and sellers
- **Bilingual Support**: Full English and French language support
- **Mobile-First Design**: Optimized for smartphone users in Cameroon
- **Cash on Delivery**: Simple payment model without online processing
- **Seller Verification**: Trust-building verification system
- **Admin Dashboard**: Comprehensive management tools

## Tech Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Hosting**: Netlify with CI/CD
- **Image Optimization**: WebP format with responsive sizing
- **Monitoring**: Sentry integration

## Installation

### Prerequisites
- Node.js (v16+)
- pnpm
- Supabase account
- Netlify account (for deployment)

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/your-org/sokoclick.git
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
Edit `.env` with your Supabase credentials.

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
│   │   ├── admin/     # Admin-specific components
│   │   ├── product/   # Product-related components
│   │   └── ui/        # Generic UI components
│   ├── hooks/         # Custom React hooks
│   ├── layouts/       # Page layout components
│   ├── pages/         # Application pages
│   ├── services/      # API and external service integrations
│   ├── store/         # State management
│   ├── styles/        # Global styles and Tailwind config
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main application component
│   ├── index.tsx      # Application entry point
│   └── routes.tsx     # Application routes
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
- Browse products on the home page
- View detailed product information
- Contact sellers directly via WhatsApp
- No account required

### Sellers
- List products through admin verification
- Receive inquiries via WhatsApp
- Manage product details and availability
- Complete verification process for trust-building

### Administrators
- Manage all 25 product slots
- Approve and moderate product listings
- Verify sellers
- Monitor platform analytics
- Configure platform settings

## Deployment

The application is configured for deployment on Netlify with Supabase as the backend.

1. Configure Netlify deployment
```bash
pnpm build
```

2. Set up required environment variables in Netlify dashboard
3. Enable continuous deployment from your repository

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

## Documentation

Additional documentation is available in the `sokoclick-docs` directory:
- [Home Page Design](sokoclick-docs/home-page-design.md)
- [Product Card Design](sokoclick-docs/product-card-design.md)
- [Product Details Page Design](sokoclick-docs/product-details-page-design.md)
- [Admin Dashboard Design](sokoclick-docs/dashboard/admin-dashboard-design.md)
