# SokoClick Home Page Design

## Overview
The SokoClick home page serves as the primary entry point for users seeking products in the Cameroonian marketplace. This design document outlines the structure, components, and functionality of the home page, focused on displaying the 25 dedicated product slots in an intuitive, mobile-optimized interface that facilitates direct WhatsApp communication between buyers and sellers.

## Design Principles
- **Mobile-First**: Optimized for smartphone users in Cameroon with consideration for varying network conditions
- **Clarity**: Present product information clearly and efficiently
- **Visual Appeal**: Showcase products with high-quality imagery
- **Accessibility**: Ensure the interface is usable by all, including those with disabilities
- **Dual Language**: Full support for both English and French

## Page Structure

### Header Section
- **Logo & Branding**: SokoClick logo and tagline
- **Language Selector**: Toggle between English and French
- **Navigation**: Minimal navigation focused on essential functions
- **Welcome Message**: Brief introduction to the platform concept

### Product Grid Section
- **Grid Layout**: Responsive design displaying the 25 product slots
  - Mobile: 2 cards per row
  - Tablet: 3 cards per row
  - Desktop: 4-5 cards per row
- **Empty Slot Treatment**: Visual indication for available slots
- **Sorting Options**: Sort by newest, ending soon, price (high/low)
- **Filtering**: Basic category filtering if applicable

### Product Card Components
- Each product card follows the detailed specifications in the product-card-design.md document
- Cards prominently display:
  - Product image
  - Title (in selected language)
  - Price in XAF/FCFA
  - Time remaining on listing
  - WhatsApp contact button

### Promotional Banner (Optional)
- Highlight special promotions or platform announcements
- Can be toggled by admin
- Localizable content in both languages

### Footer Section
- **About**: Brief platform description
- **Contact**: Platform admin contact information
- **Terms & Privacy**: Legal information
- **Language**: Secondary language toggle
- **Copyright**: Legal notices

## Technical Implementation

### Component Structure
```typescript
interface HomePageProps {
  products: Array<{
    id: string;
    slotNumber: number;
    title: {
      en: string;
      fr: string;
    };
    price: number;
    currency: 'XAF' | 'FCFA';
    mainImage: string;
    listingTime: {
      startTime: string; // ISO date string
      endTime: string;   // ISO date string
    };
    seller: {
      name: string;
      whatsappNumber: string;
      location: string;
    };
  }>;
  emptySlots: number[]; // Array of available slot numbers
  currentLanguage: 'en' | 'fr';
  promotionalBanner?: {
    active: boolean;
    content: {
      en: string;
      fr: string;
    };
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

// Home page component structure
const HomePage: React.FC<HomePageProps> = ({
  products,
  emptySlots,
  currentLanguage,
  promotionalBanner
}) => {
  // State for sorting and filtering
  const [sortCriteria, setSortCriteria] = useState<'newest'|'endingSoon'|'priceHigh'|'priceLow'>('newest');
  const [filterCategory, setFilterCategory] = useState<string|null>(null);
  
  // Sort and filter logic
  const displayedProducts = useMemo(() => {
    let result = [...products];
    
    // Apply filtering if needed
    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }
    
    // Apply sorting
    switch(sortCriteria) {
      case 'newest':
        return result.sort((a, b) => new Date(b.listingTime.startTime).getTime() - new Date(a.listingTime.startTime).getTime());
      case 'endingSoon':
        return result.sort((a, b) => new Date(a.listingTime.endTime).getTime() - new Date(b.listingTime.endTime).getTime());
      case 'priceHigh':
        return result.sort((a, b) => b.price - a.price);
      case 'priceLow':
        return result.sort((a, b) => a.price - b.price);
      default:
        return result;
    }
  }, [products, sortCriteria, filterCategory]);
  
  return (
    <div className="sokoclick-home-page">
      {/* Header component */}
      <Header currentLanguage={currentLanguage} />
      
      {/* Promotional banner if active */}
      {promotionalBanner?.active && (
        <PromotionalBanner 
          content={promotionalBanner.content[currentLanguage]}
          link={promotionalBanner.link}
          backgroundColor={promotionalBanner.backgroundColor}
          textColor={promotionalBanner.textColor}
        />
      )}
      
      {/* Controls for sorting/filtering */}
      <div className="product-controls">
        <SortingSelector 
          value={sortCriteria} 
          onChange={setSortCriteria} 
          language={currentLanguage} 
        />
      </div>
      
      {/* Main product grid */}
      <div className="product-grid">
        {displayedProducts.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            currentLanguage={currentLanguage}
          />
        ))}
        {emptySlots.map(slotNumber => (
          <EmptySlotCard 
            key={`empty-${slotNumber}`}
            slotNumber={slotNumber}
            currentLanguage={currentLanguage}
          />
        ))}
      </div>
      
      {/* Footer component */}
      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};
```

## Data Loading Strategy
- **Initial Load**: 
  - Load products in current slots with essential data only (title, price, main image)
  - Progressive image loading for slower connections
  - Skeleton loading states for unloaded product cards

- **Pagination/Infinite Scroll**:
  - Since there are only 25 slots, standard pagination may not be necessary
  - Consider virtual scrolling for very low-end devices

- **Refresh Strategy**:
  - Periodic background refresh to update time remaining
  - Pull-to-refresh functionality on mobile
  - "Check for new listings" button

## Responsive Design Specifications

### Mobile View (Primary)
- **Layout**: 2 product cards per row
- **Card Size**: ~160-180px width, dynamic height
- **Header**: Compact with collapsible elements
- **Controls**: Touch-optimized dropdowns
- **WhatsApp Buttons**: Prominent size for easy tapping

### Tablet View
- **Layout**: 3 product cards per row
- **Navigation**: Expanded options in header
- **Controls**: Inline sorting/filtering

### Desktop View
- **Layout**: 4-5 product cards per row
- **Navigation**: Full navigation bar
- **Enhanced Features**: Hover states, tooltips
- **Controls**: Expanded filters and sorting visible simultaneously

## Transitions and Animations
- **Card Loading**: Subtle fade-in for product cards
- **Language Toggle**: Smooth transition between languages
- **Sort/Filter**: Gentle reordering animation
- **Time Updates**: Non-disruptive updates for countdown timers

## Performance Considerations
- **Image Optimization**:
  - WebP format with JPEG fallback
  - Appropriate sizes for different viewports
  - Lazy loading below the fold
  - Low-quality image placeholders (LQIP)

- **Code Optimization**:
  - Code splitting for non-critical components
  - Tree-shaking unused code
  - Memoization for sorting/filtering operations
  - Efficient re-rendering strategies

- **Caching Strategy**:
  - Cache product data with appropriate TTL
  - Service worker for offline functionality
  - CDN for static assets

## Accessibility Requirements
- **Semantic HTML**: Proper use of landmarks, headings, and ARIA roles
- **Keyboard Navigation**: Full navigation without mouse
- **Screen Reader Support**: Descriptive alt text and ARIA labels
- **Color Contrast**: WCAG AA compliance (minimum 4.5:1)
- **Focus Management**: Clear visual indicators for keyboard users
- **Reduced Motion**: Support for users who prefer minimal animations

## Localization
- **Content**: All text in both English and French
- **Date/Time Formatting**: Localized display of dates and times
- **Number/Currency**: Proper formatting for Cameroonian context
- **Dynamic Layout**: Accommodate text expansion/contraction between languages
- **RTL Support**: Foundation for future language additions if needed

## Analytics Integration
- **Page Views**: Track unique visitors and return visits
- **Product Interactions**: Track clicks on product cards
- **WhatsApp Engagement**: Measure click-through rates on WhatsApp buttons
- **Sort/Filter Usage**: Understand user preferences
- **Language Preference**: Track language toggle usage

## SEO Optimization
- **Page Title**: "SokoClick - Online Marketplace in Cameroon" (with equivalent in French)
- **Meta Description**: Dynamic description highlighting available products
- **Structured Data**: Product markup using Schema.org
- **Canonical URLs**: Proper canonical tags for different sorting/filtering states
- **Image ALT Text**: Descriptive text for all product images
- **Indexability**: Ensure search engines can discover and index content

## Future Enhancements (Roadmap)
- **Search Functionality**: Product search for larger inventory
- **Category Navigation**: Enhanced category browsing
- **Featured Products**: Highlight specific slots
- **User Preferences**: Remember sorting/filtering preferences
- **Share Functionality**: Easy sharing of products via social media

This home page design creates a streamlined, effective marketplace experience that focuses on connecting buyers and sellers through WhatsApp while optimizing for the mobile-first Cameroonian market. 