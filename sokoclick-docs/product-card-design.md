# SokoClick Product Card Design

## Overview
The product card is a critical UI component for SokoClick, serving as the primary visual representation of products on the platform. This design document details the structure, appearance, and functionality of product cards that will be displayed in the 25 dedicated slots on the home page.

## Design Principles
- **Clarity**: Present essential product information concisely
- **Visual Appeal**: Showcase products with high-quality imagery
- **Actionable**: Clear path to WhatsApp communication
- **Mobile Optimized**: Designed for touch interaction and small screens
- **Bilingual**: Support for both English and French content
- **Lightweight**: Optimized for fast loading on variable connections
- **Trust-Building**: Clearly communicate seller verification status and payment methods

## Card Structure

### Visual Elements
- **Product Image**:
  - Primary visual element (16:9 or 4:3 aspect ratio)
  - Occupies ~60% of card height
  - Consistent sizing across all cards
  - Optimized for mobile loading

- **Status Indicator**:
  - Time remaining indicator (countdown)
  - "New" badge for recently added products (≤24 hours)
  - "Ending Soon" badge for listings ending within 24 hours

- **Price Display**:
  - Prominent position (top-right overlay on image)
  - High contrast background for readability
  - XAF/FCFA currency indication

- **Title Area**:
  - Clear, readable font
  - 1-2 lines maximum with ellipsis for overflow
  - Displayed in user's selected language

- **WhatsApp Button**:
  - Distinctive WhatsApp green color
  - WhatsApp icon + localized "Contact Seller" text
  - Optimized touch target size (min 44×44px)

- **Payment Method Badge**:
  - "Cash on Delivery Only" badge prominently displayed
  - Localized in both English and French
  - Visual icon indicating in-person payment
  - Positioned near price or below product info

- **Seller Verification Badge**:
  - Visual indicator showing seller verification status
  - "Verified Seller" badge for sellers who completed verification
  - Gray/neutral state for unverified sellers
  - Small icon that communicates trust

### Optional Elements
- **Location**: Seller's city/region
- **Category Tag**: Product category indication
- **Secondary Image Indicator**: Dot pattern for products with multiple images
- **Delivery Options**: Brief indication of available delivery options

## States and Interactions

### Default State
- Clean presentation of product essentials
- Optimized for scanning many products quickly

### Tap/Click Interaction
- Entire card (except WhatsApp button) links to product detail page
- WhatsApp button initiates WhatsApp communication
- Clear visual feedback on tap/press

### Loading State
- Skeleton loading animation
- Low-quality image placeholder (LQIP)
- Progressive image loading

### Empty Slot State (Admin Only)
- Visual indication of vacant slot
- Reduced opacity or distinctive styling
- Admin-specific actions for slot management

## Technical Implementation

### Component Definition
```typescript
interface ProductCardProps {
  product: {
    id: string;
    slotNumber: number;
    title: {
      en: string;
      fr: string;
    };
    price: number;
    currency: 'XAF' | 'FCFA';
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
      isVerified: boolean; // Indicates if seller has completed verification
    };
    category?: string;
    deliveryOptions?: {
      availableAreas: string[];
      estimatedDays: number;
      hasFee: boolean;
      feeAmount?: number;
    };
  };
  currentLanguage: 'en' | 'fr';
  isAdmin?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentLanguage,
  isAdmin = false
}) => {
  // Localized texts
  const contactSellerText = {
    en: 'Contact Seller',
    fr: 'Contacter le Vendeur'
  };
  
  const endingSoonText = {
    en: 'Ending Soon',
    fr: 'Se Termine Bientôt'
  };
  
  const newListingText = {
    en: 'New',
    fr: 'Nouveau'
  };
  
  const cashOnDeliveryText = {
    en: 'Cash on Delivery Only',
    fr: 'Paiement à la Livraison Uniquement'
  };
  
  const verifiedSellerText = {
    en: 'Verified Seller',
    fr: 'Vendeur Vérifié'
  };
  
  // Calculate time remaining and listing status
  const timeRemaining = useMemo(() => {
    const now = new Date();
    const endTime = new Date(product.listingTime.endTime);
    const startTime = new Date(product.listingTime.startTime);
    const isNew = now.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000;
    const isEndingSoon = endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
    
    const timeLeft = endTime.getTime() - now.getTime();
    if (timeLeft <= 0) {
      return { text: { en: 'Ended', fr: 'Terminé' }, isActive: false };
    }
    
    // Format time remaining
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return {
        text: {
          en: `${days}d ${hours}h left`,
          fr: `${days}j ${hours}h restant`
        },
        isActive: true,
        isNew,
        isEndingSoon
      };
    } else {
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: {
          en: `${hours}h ${minutes}m left`,
          fr: `${hours}h ${minutes}m restant`
        },
        isActive: true,
        isNew,
        isEndingSoon
      };
    }
  }, [product.listingTime]);

  // Handle WhatsApp interaction
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    
    // Format product name for WhatsApp message
    const productName = product.title[currentLanguage];
    
    // Create WhatsApp link with pre-filled message
    const message = encodeURIComponent(
      currentLanguage === 'en'
        ? `Hello, I'm interested in your product "${productName}" on SokoClick (Slot #${product.slotNumber}).`
        : `Bonjour, je suis intéressé par votre produit "${productName}" sur SokoClick (Emplacement #${product.slotNumber}).`
    );
    
    // Open WhatsApp with the pre-filled message
    window.open(`https://wa.me/${product.seller.whatsappNumber}?text=${message}`, '_blank');
  };
  
  return (
    <div className="product-card" data-slot={product.slotNumber}>
      <Link to={`/product/${product.slotNumber}`} className="product-card-link">
        {/* Product image */}
        <div className="product-image-container">
          <img 
            src={product.mainImage} 
            alt={product.title[currentLanguage]} 
            className="product-image" 
            loading="lazy" 
          />
          
          {/* Price tag overlay */}
          <div className="price-tag">
            {product.price.toLocaleString()} {product.currency}
          </div>
          
          {/* Status badges */}
          <div className="status-badges">
            {timeRemaining.isNew && (
              <span className="badge new-badge">
                {newListingText[currentLanguage]}
              </span>
            )}
            {timeRemaining.isEndingSoon && (
              <span className="badge ending-soon-badge">
                {endingSoonText[currentLanguage]}
              </span>
            )}
          </div>
          
          {/* Multiple images indicator */}
          {product.additionalImages && product.additionalImages.length > 0 && (
            <div className="multiple-images-indicator">
              {/* dots for each image */}
              {[product.mainImage, ...product.additionalImages].map((_, index) => (
                <span key={index} className={`dot ${index === 0 ? 'active' : ''}`} />
              ))}
            </div>
          )}
        </div>
        
        {/* Product info */}
        <div className="product-info">
          <h3 className="product-title">{product.title[currentLanguage]}</h3>
          
          {/* Location if available */}
          {product.seller.location && (
            <div className="product-location">
              <LocationIcon /> {product.seller.location}
            </div>
          )}
          
          {/* Time remaining */}
          <div className={`time-remaining ${timeRemaining.isEndingSoon ? 'ending-soon' : ''}`}>
            <ClockIcon /> {timeRemaining.text[currentLanguage]}
          </div>
          
          {/* Cash on delivery badge */}
          <div className="payment-badge">
            <CashIcon /> {cashOnDeliveryText[currentLanguage]}
          </div>
          
          {/* Seller verification badge (if verified) */}
          {product.seller.isVerified && (
            <div className="verification-badge">
              <VerifiedIcon /> {verifiedSellerText[currentLanguage]}
            </div>
          )}
          
          {/* Delivery options summary (if available) */}
          {product.deliveryOptions && (
            <div className="delivery-options">
              <TruckIcon />
              {currentLanguage === 'en' 
                ? `Delivery: ${product.deliveryOptions.estimatedDays} days` 
                : `Livraison: ${product.deliveryOptions.estimatedDays} jours`
              }
            </div>
          )}
        </div>
      </Link>
      
      {/* WhatsApp contact button */}
      <button 
        className="whatsapp-button" 
        onClick={handleWhatsAppClick}
        aria-label={contactSellerText[currentLanguage]}
      >
        <WhatsAppIcon />
        <span>{contactSellerText[currentLanguage]}</span>
      </button>
      
      {/* Admin-only actions */}
      {isAdmin && (
        <div className="admin-actions">
          <button className="edit-slot-button">
            <EditIcon />
          </button>
        </div>
      )}
    </div>
  );
};
```

## Styling Specifications

### Dimensions
- **Mobile Card Width**: 160-180px (2 cards per row)
- **Tablet Card Width**: 200-240px (3 cards per row)
- **Desktop Card Width**: 240-280px (4-5 cards per row)
- **Aspect Ratio**: 1:1.5 (approximate total card ratio)
- **Image Ratio**: 16:9 or 4:3
- **Margins**: 8px between cards (mobile), 12-16px (desktop)
- **Border Radius**: 8px (card), 6px (buttons)

### Typography
- **Title**: 14-16px, bold/semi-bold, high contrast
- **Price**: 16-18px, bold, accent color
- **Location/Category**: 12px, regular weight, secondary color
- **Time Remaining**: 12px, color varies based on urgency
- **WhatsApp Button**: 14px, bold, high contrast on green
- **Payment Badge**: 12px, bold/medium, high visibility
- **Verification Badge**: 12px, medium, trust-indicating color

### Colors
- **Card Background**: White (#FFFFFF)
- **Card Border/Shadow**: Subtle shadow or light border
- **Primary Text**: Near black (#212121)
- **Secondary Text**: Dark gray (#757575)
- **Price Tag Background**: Brand primary color with high contrast
- **Status Badge Colors**:
  - New: Blue/green accent
  - Ending Soon: Orange/red accent
- **WhatsApp Button**: WhatsApp green (#25D366)
- **Cash on Delivery Badge**: Orange or amber accent (#F59E0B)
- **Verification Badge**: Trust blue or green accent (#3B82F6)

## Responsive Behavior

### Mobile Optimization
- Larger touch targets for the WhatsApp button
- Simplified information display
- Optimized typography for small screens
- Stack elements vertically within card for narrow viewports

### Tablet Adaptations
- Slightly more information displayed
- Larger imagery
- Optional horizontal layout for certain elements

### Desktop Enhancements
- Hover effects and transitions
- More detailed information where space allows
- Enhanced visual treatment

## Performance Optimizations

### Image Handling
- **Format**: WebP with JPEG fallback
- **Sizing**: Multiple resolutions for responsive serving
- **Loading**: Lazy loading for offscreen cards
- **Placeholders**: LQIP (Low-Quality Image Placeholders)

### Rendering Optimizations
- Virtual rendering for large collections
- Memoization to prevent unnecessary re-renders
- Hardware-accelerated animations
- Efficient DOM updates using React best practices

## Accessibility Considerations
- **Color Contrast**: WCAG AA compliance (minimum 4.5:1)
- **Text Size**: Minimum 12px for readability
- **Touch Targets**: Minimum 44×44px for interactive elements
- **Keyboard Navigation**: Full support for keyboard users
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Indicators**: Visible focus states for keyboard users

## Localization
- All text elements support English and French
- Currency formatting appropriate for Cameroon
- Date/time formatting adapts to language preference
- Support for text expansion in translations

## Empty Slot Treatment (Admin View)
- Distinct styling for empty slots
- Clear call-to-action for adding products
- Slot number prominently displayed
- Reduced opacity or desaturated appearance

## Component Integration
The product card component is designed to be used:
- On the home page in the main product grid
- In category-specific listings
- In search results
- As part of admin slot management interfaces

## Payment Method Display
The product card clearly indicates that all transactions are cash on delivery only to set proper expectations for buyers:

- **Prominent Badge**: The "Cash on Delivery Only" badge is displayed on each product card
- **Consistent Placement**: The payment badge maintains the same position across all cards
- **Clear Visual Language**: Uses a recognizable cash/payment icon
- **Bilingual Support**: Badge text is displayed in the user's selected language
- **Visual Distinction**: The badge uses a distinctive color to ensure visibility

## Seller Verification Indicators
To build trust and transparency, the product card includes verification status indicators:

- **Verified Seller Badge**: Displayed for sellers who have completed the verification process
- **Visual Hierarchy**: The verification badge is styled to communicate trust and security
- **Unobtrusive Design**: The badge is visible without overwhelming other card elements
- **Contextual Information**: On hover/tap, displays a tooltip with verification details
- **Verification Process Link**: Optional link to learn about the verification process

This product card design creates a compelling, efficient presentation of products that emphasizes the key information buyers need while providing clear access to WhatsApp communication, optimized for mobile-first usage in the Cameroonian market. The addition of payment method indicators and seller verification badges enhances transparency and builds trust in the platform. 