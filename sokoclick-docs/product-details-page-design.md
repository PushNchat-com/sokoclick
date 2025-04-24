# SokoClick Product Details Page Design

## Overview
The product details page provides comprehensive information about a single product listing in one of SokoClick's 25 dedicated slots. This page expands on the information presented in the product card, offering a complete view of the product with multiple images, detailed descriptions, and prominent WhatsApp integration for contacting the seller.

## Design Principles
- **Focus**: Highlight product details and facilitate buyer-seller connection
- **Clarity**: Present information in a logical, easy-to-scan format
- **Engagement**: Encourage WhatsApp communication through prominent CTAs
- **Mobile-First**: Optimized for smartphone users in Cameroon
- **Bilingual**: Full support for both English and French content
- **Speed**: Fast loading with progressive enhancement
- **Transparency**: Clear communication about payment and delivery options

## Page Structure

### Header Section
- **Navigation Bar**:
  - Back button to return to home page
  - Language toggle (EN/FR)
  - Slot indicator (1-25)
  - Optional breadcrumb navigation

- **Product Title**:
  - Large, prominent display
  - Supports both English and French
  - Appropriate text wrapping for mobile screens

- **Status Display**:
  - Listing timeframe indicator
  - Time remaining countdown
  - Status badges ("New", "Ending Soon", etc.)
  - Category tag (if applicable)

### Gallery Section
- **Primary Image**:
  - Large, high-quality display
  - Tap to view full-screen
  - Pinch-to-zoom functionality on mobile

- **Image Gallery**:
  - Horizontal scrolling thumbnails
  - Active state for current image
  - Swipe navigation on mobile
  - Pagination indicators
  - Support for 1-10 images per product

### Product Information Section
- **Price Display**:
  - Large, prominent price with XAF/FCFA currency
  - Optional original price with discount percentage (for future enhancement)

- **Payment Method Section**:
  - Prominently displayed "Cash on Delivery Only" notice
  - Visual icon reinforcing in-person payment
  - Clear explanation text about payment process
  - No online payment options mentioned

- **Delivery Information**:
  - Available delivery options and areas
  - Estimated delivery timeframe
  - Delivery fee (if applicable)
  - Pickup options (if available)

- **Product Description**:
  - Bilingual support (English/French)
  - Rich text formatting (lists, bold, italics)
  - Expandable/collapsible for longer descriptions
  - Automatically translatable between languages

- **Key Details List**:
  - Location (city/region)
  - Condition (new/used)
  - Custom attributes based on product type
  - Listing start and end dates

### Seller Information Section
- **Seller Profile**:
  - Seller name
  - Location
  - Optional seller image/logo
  - Verification badge and status (verified/unverified)
  - Duration on platform (joined date)

- **Seller Verification Details**:
  - Visual trust indicators
  - Verification level with explanation
  - Identity verification status
  - WhatsApp number verification status
  - Date of verification

- **WhatsApp Contact Area**:
  - Large, prominent WhatsApp button
  - Pre-formatted message with product reference
  - Visual emphasis with WhatsApp brand colors
  - Click-to-call option as secondary contact method

### Related Products Section (Optional)
- **Similar Products**:
  - 2-4 related products from other slots
  - Uses standard product card components
  - Filtering based on category or seller

## States and Interactions

### Default View
- All essential information visible
- Optimized for scanning key details quickly
- Primary CTA (WhatsApp) prominently displayed

### Image Gallery Interaction
- Tap image to enter full-screen gallery mode
- Swipe between images
- Pinch to zoom on mobile
- Gallery progress indicator (e.g., "2/5")

### WhatsApp Integration
- Tap WhatsApp button to open WhatsApp with pre-populated message
- Message includes product name, slot number, and brief greeting
- Different message templates for English and French
- Fallback for devices without WhatsApp installed

### Payment Information Interaction
- Expandable section with more payment details
- Clear visual cues for cash-only policy
- FAQ section about payment process (optional)

### Expired/Inactive Listings
- Visual indication of inactive state
- Reduced prominence of contact options
- Option to view similar active products
- Clear messaging about listing status

## Technical Implementation

### Component Structure
```typescript
interface ProductDetailsPageProps {
  slotNumber: number;
  currentLanguage: 'en' | 'fr';
  isAdmin?: boolean;
}

interface ProductDetailsData {
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
    verificationLevel: 'basic' | 'complete';
    verificationDate?: string; // ISO date string
    joinedDate: string; // ISO date string
  };
  delivery: {
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
  category?: string;
  condition?: 'new' | 'used' | 'refurbished';
  attributes?: {
    name: string;
    value: string;
  }[];
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  slotNumber,
  currentLanguage,
  isAdmin = false
}) => {
  // State to store product details
  const [product, setProduct] = useState<ProductDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  
  // Fetch product details based on slot number
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // API call to fetch product by slot number
        const response = await fetch(`/api/products/slot/${slotNumber}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
        // Handle error state
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [slotNumber]);
  
  // Calculate time remaining for the listing
  const timeRemaining = useMemo(() => {
    if (!product) return null;
    
    const now = new Date();
    const endTime = new Date(product.listingTime.endTime);
    const startTime = new Date(product.listingTime.startTime);
    const isNew = now.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000;
    const isEndingSoon = endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
    const isActive = now >= startTime && now <= endTime;
    
    const timeLeft = endTime.getTime() - now.getTime();
    if (timeLeft <= 0) {
      return { 
        text: { 
          en: 'Listing has ended', 
          fr: 'L\'annonce est terminée' 
        }, 
        isActive: false 
      };
    }
    
    // Format time remaining
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return {
        text: {
          en: `${days} days, ${hours} hours remaining`,
          fr: `${days} jours, ${hours} heures restants`
        },
        isActive,
        isNew,
        isEndingSoon
      };
    } else {
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: {
          en: `${hours} hours, ${minutes} minutes remaining`,
          fr: `${hours} heures, ${minutes} minutes restants`
        },
        isActive,
        isNew,
        isEndingSoon
      };
    }
  }, [product]);
  
  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    if (!product) return;
    
    const productName = product.title[currentLanguage];
    const message = encodeURIComponent(
      currentLanguage === 'en'
        ? `Hello, I'm interested in your product "${productName}" on SokoClick (Slot #${product.slotNumber}).`
        : `Bonjour, je suis intéressé par votre produit "${productName}" sur SokoClick (Emplacement #${product.slotNumber}).`
    );
    
    window.open(`https://wa.me/${product.seller.whatsappNumber}?text=${message}`, '_blank');
  };
  
  // Render loading state
  if (loading) {
    return <ProductDetailsSkeleton />;
  }
  
  // Render 404 state if product not found
  if (!product) {
    return <ProductNotFound />;
  }
  
  return (
    <div className="product-details-page">
      {/* Header */}
      <header className="product-header">
        <button 
          className="back-button" 
          onClick={() => history.back()}
          aria-label={currentLanguage === 'en' ? 'Back to home' : 'Retour à l\'accueil'}
        >
          <BackIcon />
        </button>
        <div className="slot-indicator">
          {currentLanguage === 'en' ? 'Slot' : 'Emplacement'} #{product.slotNumber}
        </div>
        <button 
          className="language-toggle"
          onClick={() => {
            // Toggle language
          }}
        >
          {currentLanguage === 'en' ? 'FR' : 'EN'}
        </button>
      </header>
      
      {/* Product Title */}
      <h1 className="product-title">{product.title[currentLanguage]}</h1>
      
      {/* Status Display */}
      <div className="status-display">
        {timeRemaining && (
          <div className={`time-remaining ${!timeRemaining.isActive ? 'inactive' : timeRemaining.isEndingSoon ? 'ending-soon' : ''}`}>
            <ClockIcon />
            <span>{timeRemaining.text[currentLanguage]}</span>
          </div>
        )}
        {product.category && (
          <div className="category-tag">
            <CategoryIcon />
            <span>{product.category}</span>
          </div>
        )}
      </div>
      
      {/* Image Gallery */}
      <div className="product-gallery">
        <div 
          className="main-image-container"
          onClick={() => setGalleryOpen(true)}
        >
          <img 
            src={product.images[activeImageIndex]} 
            alt={product.title[currentLanguage]} 
            className="main-product-image"
          />
          {product.images.length > 1 && (
            <div className="image-counter">
              {activeImageIndex + 1}/{product.images.length}
            </div>
          )}
        </div>
        
        {product.images.length > 1 && (
          <div className="thumbnail-gallery">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail-item ${index === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Full-screen gallery modal */}
      {galleryOpen && (
        <FullScreenGallery
          images={product.images}
          initialIndex={activeImageIndex}
          onClose={() => setGalleryOpen(false)}
          onIndexChange={setActiveImageIndex}
          alt={product.title[currentLanguage]}
        />
      )}
      
      {/* Price */}
      <div className="product-price">
        {product.price.toLocaleString()} {product.currency}
      </div>
      
      {/* Payment Method Section */}
      <div className="payment-method-section">
        <div className="payment-method-header">
          <CashIcon />
          <h2>
            {currentLanguage === 'en' 
              ? 'Cash on Delivery Only' 
              : 'Paiement à la Livraison Uniquement'}
          </h2>
        </div>
        <p className="payment-method-description">
          {currentLanguage === 'en'
            ? 'This product is available for cash payment on delivery only. No online payments are processed through SokoClick. Arrange payment details with the seller via WhatsApp.'
            : 'Ce produit est disponible uniquement pour paiement en espèces à la livraison. Aucun paiement en ligne n\'est traité par SokoClick. Organisez les détails du paiement avec le vendeur via WhatsApp.'
          }
        </p>
      </div>
      
      {/* Delivery Options */}
      {product.delivery && (
        <div className="delivery-options-section">
          <h2>
            {currentLanguage === 'en' ? 'Delivery Options' : 'Options de Livraison'}
          </h2>
          <ul className="delivery-options-list">
            {product.delivery.options.map((option, index) => (
              <li key={index} className="delivery-option-item">
                <div className="delivery-option-name">
                  <TruckIcon />
                  <span>{option.name[currentLanguage]}</span>
                </div>
                <div className="delivery-option-details">
                  <span className="delivery-areas">
                    {currentLanguage === 'en' ? 'Areas: ' : 'Zones: '}
                    {option.areas.join(', ')}
                  </span>
                  <span className="delivery-time">
                    {currentLanguage === 'en'
                      ? `${option.estimatedDays} days delivery`
                      : `Livraison en ${option.estimatedDays} jours`
                    }
                  </span>
                  {option.fee > 0 && (
                    <span className="delivery-fee">
                      {currentLanguage === 'en'
                        ? `Fee: ${option.fee.toLocaleString()} ${product.currency}`
                        : `Frais: ${option.fee.toLocaleString()} ${product.currency}`
                      }
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {product.delivery.note && (
            <p className="delivery-note">
              {product.delivery.note[currentLanguage]}
            </p>
          )}
        </div>
      )}
      
      {/* Product Description */}
      <div className="product-description">
        <h2>
          {currentLanguage === 'en' ? 'Description' : 'Description'}
        </h2>
        <div className="description-content">
          {product.description[currentLanguage]}
        </div>
      </div>
      
      {/* Key Details */}
      <div className="product-details">
        <h2>
          {currentLanguage === 'en' ? 'Details' : 'Détails'}
        </h2>
        <ul className="details-list">
          {product.condition && (
            <li className="detail-item">
              <span className="detail-label">
                {currentLanguage === 'en' ? 'Condition' : 'État'}:
              </span>
              <span className="detail-value">
                {currentLanguage === 'en' 
                  ? product.condition.charAt(0).toUpperCase() + product.condition.slice(1) 
                  : product.condition === 'new' 
                    ? 'Neuf'
                    : product.condition === 'used'
                    ? 'Utilisé'
                    : 'Reconditionné'
                }
              </span>
            </li>
          )}
          <li className="detail-item">
            <span className="detail-label">
              {currentLanguage === 'en' ? 'Location' : 'Emplacement'}:
            </span>
            <span className="detail-value">
              {product.seller.location}
            </span>
          </li>
          {product.attributes && product.attributes.map((attr, index) => (
            <li key={index} className="detail-item">
              <span className="detail-label">{attr.name}:</span>
              <span className="detail-value">{attr.value}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Seller Information */}
      <div className="seller-section">
        <h2>
          {currentLanguage === 'en' ? 'Seller Information' : 'Information du Vendeur'}
        </h2>
        <div className="seller-card">
          {product.seller.image && (
            <img 
              src={product.seller.image} 
              alt={product.seller.name} 
              className="seller-image"
            />
          )}
          <div className="seller-info">
            <h3 className="seller-name">
              {product.seller.name}
              {product.seller.isVerified && (
                <span className="verification-badge">
                  <VerifiedIcon />
                  {currentLanguage === 'en' ? 'Verified' : 'Vérifié'}
                </span>
              )}
            </h3>
            <p className="seller-location">
              <LocationIcon />
              {product.seller.location}
            </p>
            <p className="seller-joined">
              <CalendarIcon />
              {currentLanguage === 'en'
                ? `Joined: ${new Date(product.seller.joinedDate).toLocaleDateString()}`
                : `Inscrit: ${new Date(product.seller.joinedDate).toLocaleDateString()}`
              }
            </p>
            {product.seller.isVerified && (
              <div className="verification-details">
                <h4>
                  {currentLanguage === 'en' 
                    ? 'Verification Details' 
                    : 'Détails de vérification'
                  }
                </h4>
                <p className="verification-level">
                  {currentLanguage === 'en'
                    ? `Level: ${product.seller.verificationLevel === 'basic' ? 'Basic' : 'Complete'}`
                    : `Niveau: ${product.seller.verificationLevel === 'basic' ? 'Basique' : 'Complet'}`
                  }
                </p>
                {product.seller.verificationDate && (
                  <p className="verification-date">
                    {currentLanguage === 'en'
                      ? `Verified on: ${new Date(product.seller.verificationDate).toLocaleDateString()}`
                      : `Vérifié le: ${new Date(product.seller.verificationDate).toLocaleDateString()}`
                    }
                  </p>
                )}
                <div className="verification-explanation">
                  <InfoIcon />
                  <span>
                    {currentLanguage === 'en'
                      ? 'This seller has been verified by SokoClick administrators and has a confirmed WhatsApp number.'
                      : 'Ce vendeur a été vérifié par les administrateurs de SokoClick et possède un numéro WhatsApp confirmé.'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* WhatsApp Contact Button */}
      <div className="contact-section">
        <button 
          className="whatsapp-contact-button"
          onClick={handleWhatsAppContact}
          disabled={!timeRemaining?.isActive}
        >
          <WhatsAppIcon />
          <span>
            {currentLanguage === 'en' 
              ? 'Contact Seller via WhatsApp' 
              : 'Contacter le Vendeur via WhatsApp'
            }
          </span>
        </button>
        
        <p className="contact-note">
          {currentLanguage === 'en'
            ? 'Discuss product details, payment, and delivery directly with the seller on WhatsApp'
            : 'Discutez des détails du produit, du paiement et de la livraison directement avec le vendeur sur WhatsApp'
          }
        </p>
        
        {!timeRemaining?.isActive && (
          <p className="listing-inactive-message">
            {currentLanguage === 'en'
              ? 'This listing is no longer active'
              : 'Cette annonce n\'est plus active'
            }
          </p>
        )}
      </div>
      
      {/* Admin-only actions */}
      {isAdmin && (
        <div className="admin-actions">
          <button className="admin-edit-button">
            <EditIcon />
            <span>
              {currentLanguage === 'en' ? 'Edit Listing' : 'Modifier l\'Annonce'}
            </span>
          </button>
          <button className="admin-delete-button">
            <DeleteIcon />
            <span>
              {currentLanguage === 'en' ? 'Delete Listing' : 'Supprimer l\'Annonce'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
```

## Styling Specifications

### Responsive Layout
- **Mobile**: Single column layout, full-width images
- **Tablet**: Enhanced image gallery, two-column layout for some sections
- **Desktop**: Optimized layout with sidebar for key actions
- **Breakpoints**:
  - Mobile: 360px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+

### Typography
- **Page Title**: 20-24px, bold
- **Section Headers**: 18px, semi-bold
- **Product Description**: 16px, regular
- **Details Labels**: 14px, medium
- **Price**: 22-26px, bold
- **WhatsApp Button**: 16-18px, bold
- **Status Text**: 14px, regular
- **Payment Method Header**: 18px, bold, distinctive color
- **Verification Badge**: 12-14px, bold, trust-indicating color

### Color Scheme
- **Background**: White or light neutral
- **Text**: Dark gray (near black) for readability
- **Accents**:
  - Brand primary for interactive elements
  - WhatsApp green (#25D366) for contact button
  - Status colors (orange for "Ending Soon," etc.)
  - Cash Payment Badge: Orange/amber (#F59E0B)
  - Verification Badge: Trust blue (#3B82F6)
- **Dividers**: Light gray for section separation
- **Gallery Controls**: Semi-transparent overlays

### Spacing
- **Section Padding**: 16px (mobile), 24px (desktop)
- **Element Spacing**: 12-16px between related elements
- **Page Margins**: 16px (mobile), 32px+ (desktop)
- **Touch Targets**: Minimum 44×44px for all interactive elements

## Performance Optimizations

### Image Handling
- **Progressive Loading**: Show low-resolution placeholders
- **Responsive Images**: Multiple sizes for different viewports
- **Lazy Loading**: Defer offscreen image loading
- **Formats**: WebP with JPEG fallback
- **Compression**: Optimized for mobile data
- **Gallery Preloading**: Preload adjacent images in gallery

### Page Loading Strategy
- **Skeleton UI**: Show layout placeholders during loading
- **Critical Path Rendering**: Prioritize above-the-fold content
- **Deferred Loading**: Load non-essential content after initial render
- **Data Prefetching**: Preload product data when card is hovered

## Accessibility Considerations
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Attributes**: For complex widgets like the image gallery
- **Keyboard Navigation**: Full support for keyboard users
- **Screen Reader Support**: Alt text for images and proper labels
- **Focus Management**: Clear focus states and logical tabbing order
- **Color Contrast**: WCAG AA compliance (minimum 4.5:1)
- **Text Resize**: Support for browser text size adjustments
- **Motion Reduction**: Respect prefers-reduced-motion settings

## Localization
- **Bilingual Content**: Full English and French support
- **Date/Time Formatting**: Localized display for listing times
- **Currency Format**: Proper formatting for XAF/FCFA
- **Direction Support**: LTR for both languages
- **Translation Management**: All UI strings externalized for easy updates

## Payment and Transaction Details
To ensure clarity around the cash-on-delivery payment model:

- **Prominent Badge**: The payment section is prominently displayed below the price
- **Clear Messaging**: Explicit statement that only cash on delivery is accepted
- **No Online Options**: No UI elements suggesting online payment options
- **Process Explanation**: Clear description of the payment process between buyer and seller
- **WhatsApp Integration**: Guidance to discuss payment details via WhatsApp
- **Multilingual Support**: All payment information presented in both English and French

## Seller Verification Features
To build trust and transparency:

- **Verification Badge**: Prominent display of verification status next to seller name
- **Verification Levels**: Display of basic or complete verification levels
- **Verification Timeline**: When the seller was verified
- **Trust Explanation**: Description of what verification means and the checks performed
- **Visual Hierarchy**: Trust indicators styled to be easily recognizable
- **Admin-Verified**: Clear indication that SokoClick administrators have verified the seller

## Error States

### Product Not Found
- Clear messaging when a product/slot doesn't exist
- Option to return to homepage
- Suggestions for other active products

### Network Errors
- Graceful handling of connectivity issues
- Retry options for failed data fetching
- Offline support for previously viewed products

### Missing Data
- Fallbacks for missing images or descriptions
- Hide sections completely when data isn't available
- Default placeholder content when appropriate

## Analytics Integration
- **Page Views**: Track detailed page visits with slot information
- **User Engagement**: Measure time on page and scroll depth
- **Gallery Interaction**: Track image viewing behavior
- **WhatsApp Clicks**: Measure conversion to contact actions
- **Language Switching**: Monitor language preference changes
- **Payment Information Viewing**: Track engagement with payment information sections

## SEO Optimization
- **Unique Titles**: Dynamic page titles with product information
- **Meta Descriptions**: Auto-generated from product descriptions
- **Structured Data**: Product markup using Schema.org
- **Canonical URLs**: Permanent URLs for each slot
- **Image Alt Text**: Descriptive alt attributes for all product images
- **Indexability Control**: Proper handling of expired listings

## Future Enhancements
- **Video Support**: Add product video playback capability
- **AR Viewing**: Augmented reality product visualization
- **Social Sharing**: Easy sharing to social platforms
- **Favorites/Bookmarking**: Save interesting products
- **Reviews/Ratings**: Add seller rating functionality
- **Similar Product Recommendations**: AI-powered similar product suggestions
- **Enhanced Verification**: Addition of seller profile verification badges with levels

This product details page design provides a comprehensive viewing experience that emphasizes clear product information and facilitates direct WhatsApp communication between buyers and sellers, optimized for the Cameroonian market with full bilingual support. The addition of clear payment methods and seller verification details builds trust and sets proper expectations for the transaction process. 