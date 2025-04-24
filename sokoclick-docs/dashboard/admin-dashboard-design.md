# SokoClick Admin Dashboard Design

## Overview
The SokoClick Admin Dashboard serves as the central control panel for platform administrators to manage and monitor all aspects of the marketplace. This design document outlines the structure, functionality, and interface of the dashboard, with a focus on efficiently managing the 25 dedicated product slots, user accounts, and overall platform performance.

## MVP Priority (24-Hour Delivery)
For the 24-hour MVP launch, we will focus on implementing these critical dashboard features:

1. **Product Creation and WhatsApp Integration**: 
   - Simplified product entry with required WhatsApp field
   - Direct seller WhatsApp association
   - Basic image upload and management
   
2. **Slot Management**:
   - Visual grid of all 25 slots
   - Drag-and-drop product assignment
   - Basic scheduling controls

3. **User Management**:
   - Simple seller creation with WhatsApp validation
   - Basic user listing and search

### MVP Implementation Timeline

| Time | Priority Tasks |
|------|----------------|
| First 8 hours | - Basic admin authentication<br>- Core product creation form with WhatsApp integration<br>- Simplified slot dashboard |
| Next 8 hours | - Slot assignment functionality<br>- WhatsApp validation and testing<br>- Basic user management |
| Final 8 hours | - Integration testing<br>- Bug fixes<br>- Deployment preparation |

## Design Principles
- **Efficiency**: Streamlined workflows for common admin tasks
- **Clarity**: Clear presentation of data and actionable information
- **Control**: Comprehensive tools for platform management
- **Security**: Role-based access control and secure operations
- **Bilingual**: Full support for both English and French
- **Responsive**: Function across devices while optimized for desktop use

## Dashboard Structure

### Authentication & Access Control
- **Login Page**:
  - Secure admin authentication with multi-factor options
  - Password policies and recovery mechanisms
  - Session management with automatic timeouts
  - Login attempt monitoring and lockout protections

- **Role-Based Access**:
  - Super Admin: Full platform access
  - Content Moderator: Product approval and content management
  - Analytics Viewer: Read-only access to performance data
  - Customer Support: User management and issue resolution

### Main Navigation
- **Primary Sidebar**:
  - Dashboard (overview)
  - Product Management
  - Slot Management
  - User Management
  - Transaction History
  - Analytics & Reports
  - Content Management
  - Settings

- **Top Bar**:
  - Admin user profile and quick settings
  - Language toggle (EN/FR)
  - Notifications center
  - Quick actions menu
  - Search functionality

### Dashboard Overview (Home)
- **Key Metrics Cards**:
  - Active products count
  - Pending approval products
  - Total registered users
  - New users (last 7 days)
  - WhatsApp conversions
  - Platform revenue (if applicable)

- **Real-time Activity**:
  - Recent user registrations
  - Recently listed products
  - Latest slot assignments
  - Recent WhatsApp engagements

- **Status Overview**:
  - Visual grid of 25 slots showing occupied/vacant status
  - Color-coded indicators for status (active, ending soon, vacant)
  - Quick-access slot management tools

- **Performance Charts**:
  - Daily/weekly user activity
  - Product listing trends
  - WhatsApp engagement rates
  - Platform growth metrics

## Product Management Section

### Quick Product Creation (MVP Priority)
- **Simplified Product Entry Form**:
  - Prominent "Create Product" button on dashboard home and product management pages
  - Streamlined form with essential fields only:
    - Product name (English/French)
    - Product price and currency
    - Product main image upload
    - **Seller WhatsApp number** (required, prominently displayed)
    - Category selection
    - Listing duration
    - **Payment method** (fixed as "Cash on Delivery Only")
  
- **WhatsApp Field Validation**:
  - Real-time validation of WhatsApp number format (+237XXXXXXXXX)
  - Clear error messages for invalid formats
  - Test button to verify number is WhatsApp-enabled
  - Explanation that this number will receive all buyer communications

- **Payment Method Settings**:
  - Clear indication that all transactions are "Cash on Delivery Only"
  - No online payment options offered in the MVP
  - Delivery area and fee configuration options
  - Estimated delivery time setting

- **Seller Association**:
  - Option to select existing seller or create new
  - When creating new seller, WhatsApp number becomes their primary identifier
  - Clear indication of which seller owns which products
  - Ability to update seller WhatsApp number if needed

- **Direct Slot Assignment**:
  - Option to immediately assign to available slot
  - Visual slot grid for selection
  - Duration setting with clear start/end times

### Product Listing View
- **Filterable Table**:
  - All products with search and advanced filtering
  - Sortable columns (date, status, seller, etc.)
  - Bulk action capabilities
  - Pagination with adjustable page size
  - **WhatsApp number column** for easy reference

- **Status Filters**:
  - All products
  - Pending approval
  - Active (in slots)
  - Expired
  - Rejected
  - Draft

- **Quick Actions**:
  - Approve/reject products
  - Edit product details
  - Assign to slot
  - View product details
  - Contact seller via WhatsApp (direct link)
  - **Test WhatsApp redirect** (for verification)

### Product Approval Workflow
- **Approval Queue**:
  - Pending products sorted by submission date
  - Preview of product details
  - Image moderation tools
  - Content verification checklist
  - **WhatsApp verification check** to ensure number is valid

- **Rejection Process**:
  - Standardized rejection reasons
  - Custom feedback option
  - Notification template to seller
  - Option to message seller via WhatsApp with explanation

- **Batch Processing**:
  - Select multiple products for approval/rejection
  - Bulk assign to slots
  - Mass edit capabilities

### Product Editor
- **Bilingual Content Editor**:
  - Fields for both English and French content
  - Validation to ensure both languages are provided
  - Rich text editor for descriptions
  - Image management with cropping and optimization

- **Details Management**:
  - Edit all product details (price, condition, etc.)
  - Manage product images (add, remove, reorder)
  - Adjust listing duration
  - **Modify seller information and WhatsApp number**
  - WhatsApp Test button to verify redirect functionality

## Slot Management Section

### Slot Grid View
- **Visual Slot Dashboard**:
  - Grid representation of all 25 slots
  - Current status and time remaining
  - Product thumbnail and basic info
  - **Seller WhatsApp indicator** for each occupied slot
  - Vacant slot indicators
  - Quick-action buttons

- **Drag and Drop Interface**:
  - Drag products to assign to slots
  - Move products between slots
  - Visual feedback during drag operations
  - Confirmation dialogs for changes

### Individual Slot Management
- **Slot Details Panel**:
  - Current product information
  - Listing history for the slot
  - Performance metrics (views, engagements)
  - Scheduling controls
  - **WhatsApp contact button** for direct seller communication

- **Slot Actions**:
  - Assign/remove product
  - Extend/shorten listing duration
  - Feature slot (premium positioning)
  - Temporarily disable slot
  - View slot analytics
  - **WhatsApp redirect test** button

### Slot Scheduling
- **Calendar Interface**:
  - Visual calendar for scheduled slot assignments
  - Upcoming product rotations
  - Drag-and-drop scheduling
  - Conflict detection and resolution

- **Automated Rotation**:
  - Configure rules for automatic product rotation
  - Queue management for upcoming products
  - Priority settings for premium sellers
  - Schedule bulk operations

## User Management Section

### Seller Quick Creation (MVP Priority)
- **Simplified Seller Form**:
  - Name field
  - Location field
  - **WhatsApp number** (with validation)
  - Email (optional for MVP)
  - Test WhatsApp functionality

- **WhatsApp Validation**:
  - Format checking
  - Country code verification (+237 for Cameroon)
  - Duplicate checking
  - Explanation of WhatsApp number usage
  - Test call to verify WhatsApp account existence

- **Seller Verification Process**:
  - Verification status toggle (verified/unverified)
  - Verification level selection (basic/complete)
  - WhatsApp verification confirmation
  - Identity document upload (optional for MVP)
  - Verification date tracking
  - Admin verification notes field

### User Directory
- **Searchable User Table**:
  - All users with filtering and search
  - User type segmentation (buyers, sellers, admins)
  - Account status indicators
  - Registration date and last activity
  - **WhatsApp number column** for sellers
  - **Verification status column** with visual indicators

- **User Profile View**:
  - Comprehensive user information
  - Account activity history
  - Products listed (for sellers)
  - Verification status
  - Communication history
  - **WhatsApp integration** for direct contact
  - **Verification documentation review panel**

- **Account Actions**:
  - Verify/approve users
  - Suspend/ban accounts
  - Reset password
  - Edit user details
  - Impersonate user (for support)
  - Send notification
  - **Send WhatsApp message** (direct redirect to WhatsApp)

### Seller Management
- **Seller Verification**:
  - Verification request queue
  - Document review interface
  - Verification checklist
  - Approval/rejection workflow
  - **WhatsApp verification** step with test call functionality
  - Verification level assignment (basic/complete)
  - Verification expiration management
  - Trust score calculation

- **Seller Performance**:
  - Products listed history
  - WhatsApp engagement metrics
  - Quality scores
  - Issue reports

- **Seller Communications**:
  - Message templates
  - Notification history
  - Bulk announcement tools
  - **WhatsApp integration** for direct contact

## Analytics & Reporting Section

### Dashboard Analytics
- **Performance Overview**:
  - Key metrics with historical trends
  - Platform growth indicators
  - User acquisition and retention
  - Engagement statistics
  - **WhatsApp conversion metrics**
  - **Seller verification rates**
  - **Cash on delivery acceptance metrics**

- **Product Insights**:
  - Most viewed products
  - Highest WhatsApp conversion rates
  - Category performance
  - Time-to-fill for vacant slots
  - **Payment method utilization data**
  - **Delivery option popularity metrics**

- **User Analytics**:
  - User growth and activity trends
  - Seller performance metrics
  - Geographic distribution
  - Device and browser statistics

- **Custom Reports**:
  - Report builder with metric selection
  - Scheduling for regular reports
  - Export options (PDF, CSV, Excel)
  - Saved report templates

### Heatmap & User Behavior
- **Slot Performance Heatmap**:
  - Visual representation of slot engagement
  - Click-through rates by position
  - WhatsApp conversion by slot
  - Comparison tools for position analysis

- **User Journey Visualization**:
  - Path analysis through the platform
  - Drop-off points and conversion funnels
  - Session duration and page views
  - Scroll depth and engagement patterns

## Content Management Section

### Promotional Banners
- **Banner Management**:
  - Create/edit promotional banners
  - Scheduling with start/end dates
  - Visual preview on mock homepage
  - Multi-language support

- **Banner Analytics**:
  - Click-through rates
  - Impression counts
  - Conversion attribution
  - A/B testing capabilities

### Static Content
- **Page Editor**:
  - Edit static pages (About, Terms, FAQ)
  - Bilingual content management
  - Rich text editing tools
  - Version history and rollback

- **Navigation Management**:
  - Customize navigation elements
  - Manage footer links
  - Create custom pages
  - Set visibility conditions

### Notification Templates
- **System Notifications**:
  - Edit email and in-app notification templates
  - Bilingual message management
  - Variable insertion support
  - Template testing tools

- **Custom Announcements**:
  - Create platform-wide announcements
  - Target specific user segments
  - Schedule delivery times
  - Track read/open rates

## Settings Section

### Platform Configuration
- **General Settings**:
  - Platform name and branding
  - Contact information
  - Time zone and date formats
  - Default language
  - Currency display options

- **Feature Toggles**:
  - Enable/disable platform features
  - Beta feature management
  - Maintenance mode settings
  - Emergency controls

### Admin User Management
- **Admin Accounts**:
  - Create and manage admin users
  - Role assignment and permissions
  - Activity logs and audit trails
  - Password and security policies

- **Activity Monitoring**:
  - Admin action history
  - Login and session logs
  - Critical action alerts
  - Suspicious activity detection

### System Logs & Monitoring
- **Error Logs**:
  - Application error tracking
  - User-reported issues
  - Resolution status and history
  - Severity classification

- **Performance Monitoring**:
  - Server health metrics
  - Response time tracking
  - Database performance
  - Resource utilization

## Technical Implementation

### WhatsApp Integration Specifics
```typescript
// WhatsApp Number Validation Utility
const validateWhatsAppNumber = (number: string): boolean => {
  // Basic format validation
  const whatsappRegex = /^\+\d{1,4}\d{6,14}$/;
  if (!whatsappRegex.test(number)) {
    return false;
  }
  
  // Check for Cameroon country code (+237)
  if (!number.startsWith('+237')) {
    return false;
  }
  
  return true;
};

// WhatsApp Redirect Test Component
const WhatsAppTest: React.FC<{number: string}> = ({ number }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const testWhatsApp = async () => {
    setIsTesting(true);
    
    // Basic validation
    if (!validateWhatsAppNumber(number)) {
      setIsValid(false);
      setIsTesting(false);
      return;
    }
    
    // Create test message
    const testMessage = encodeURIComponent('Hello, this is a test message from SokoClick.');
    const whatsappURL = `https://wa.me/${number.replace('+', '')}?text=${testMessage}`;
    
    // Open WhatsApp in a new window
    const whatsappWindow = window.open(whatsappURL, '_blank');
    
    // Set a timeout to check if window was blocked
    setTimeout(() => {
      setIsValid(whatsappWindow !== null);
      setIsTesting(false);
    }, 1000);
  };
  
  return (
    <div className="whatsapp-test">
      <button 
        className="test-button"
        onClick={testWhatsApp}
        disabled={isTesting}
      >
        {isTesting ? 'Testing...' : 'Test WhatsApp'}
      </button>
      
      {isValid === true && (
        <div className="success-message">
          WhatsApp redirect is working correctly.
        </div>
      )}
      
      {isValid === false && (
        <div className="error-message">
          There was a problem with the WhatsApp number or redirect.
        </div>
      )}
    </div>
  );
};

// Product Creation Form with WhatsApp Integration
interface ProductFormProps {
  onSubmit: (productData: ProductData) => Promise<void>;
  language: 'en' | 'fr';
}

const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  language
}) => {
  const [formData, setFormData] = useState<Partial<ProductData>>({
    name_en: '',
    name_fr: '',
    price: 0,
    currency: 'XAF',
    seller_whatsapp: '',
    category: '',
    images: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSellerWhatsAppChange = (value: string) => {
    setFormData({...formData, seller_whatsapp: value});
    
    // Validate format
    if (value && !validateWhatsAppNumber(value)) {
      setErrors({
        ...errors,
        seller_whatsapp: language === 'en' 
          ? 'Invalid WhatsApp number format. Use +237XXXXXXXXX' 
          : 'Format de numéro WhatsApp invalide. Utilisez +237XXXXXXXXX'
      });
    } else {
      // Remove error if valid
      const newErrors = {...errors};
      delete newErrors.seller_whatsapp;
      setErrors(newErrors);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.name_en) {
      newErrors.name_en = language === 'en' ? 'English name is required' : 'Le nom en anglais est requis';
    }
    
    if (!formData.name_fr) {
      newErrors.name_fr = language === 'en' ? 'French name is required' : 'Le nom en français est requis';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = language === 'en' ? 'Valid price is required' : 'Un prix valide est requis';
    }
    
    if (!formData.seller_whatsapp) {
      newErrors.seller_whatsapp = language === 'en' 
        ? 'Seller WhatsApp number is required' 
        : 'Le numéro WhatsApp du vendeur est requis';
    } else if (!validateWhatsAppNumber(formData.seller_whatsapp)) {
      newErrors.seller_whatsapp = language === 'en' 
        ? 'Invalid WhatsApp number format. Use +237XXXXXXXXX' 
        : 'Format de numéro WhatsApp invalide. Utilisez +237XXXXXXXXX';
    }
    
    if (formData.images.length === 0) {
      newErrors.images = language === 'en' ? 'At least one image is required' : 'Au moins une image est requise';
    }
    
    // If we have errors, show them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await onSubmit(formData as ProductData);
      // Reset form on success
      setFormData({
        name_en: '',
        name_fr: '',
        price: 0,
        currency: 'XAF',
        seller_whatsapp: '',
        category: '',
        images: []
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting product:', error);
      setErrors({
        submit: language === 'en' 
          ? 'Error creating product. Please try again.' 
          : 'Erreur lors de la création du produit. Veuillez réessayer.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {/* Basic product details fields */}
      
      {/* WhatsApp field with validation and testing */}
      <div className="form-group whatsapp-field">
        <label className="required">
          {language === 'en' ? 'Seller WhatsApp Number' : 'Numéro WhatsApp du Vendeur'}
        </label>
        <div className="whatsapp-input-group">
          <input
            type="text"
            value={formData.seller_whatsapp}
            onChange={(e) => handleSellerWhatsAppChange(e.target.value)}
            placeholder="+237XXXXXXXXX"
            className={errors.seller_whatsapp ? 'error' : ''}
          />
          {formData.seller_whatsapp && !errors.seller_whatsapp && (
            <WhatsAppTest number={formData.seller_whatsapp} />
          )}
        </div>
        {errors.seller_whatsapp && (
          <div className="error-message">{errors.seller_whatsapp}</div>
        )}
        <div className="field-help">
          {language === 'en' 
            ? 'This number will receive all buyer inquiries via WhatsApp' 
            : 'Ce numéro recevra toutes les demandes des acheteurs via WhatsApp'}
        </div>
      </div>
      
      {/* Other form fields */}
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (language === 'en' ? 'Creating...' : 'Création...') 
            : (language === 'en' ? 'Create Product' : 'Créer Produit')}
        </button>
      </div>
    </form>
  );
};
```

### Component Structure
```typescript
interface AdminDashboardProps {
  currentAdmin: AdminUser;
  currentLanguage: 'en' | 'fr';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'content_moderator' | 'analytics_viewer' | 'customer_support';
  permissions: string[];
  lastLogin: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  currentLanguage
}) => {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Fetch dashboard data
  useEffect(() => {
    // Load initial dashboard data
    fetchDashboardMetrics();
    fetchRecentActivity();
    fetchSlotStatus();
    
    // Setup real-time updates if needed
    const unsubscribe = supabase
      .channel('dashboard-updates')
      .on('*', handleRealtimeUpdate)
      .subscribe();
      
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Render appropriate page based on navigation
  const renderActivePage = () => {
    switch(activePage) {
      case 'dashboard':
        return <DashboardOverview language={currentLanguage} />;
      case 'products':
        return <ProductManagement language={currentLanguage} />;
      case 'slots':
        return <SlotManagement language={currentLanguage} />;
      case 'users':
        return <UserManagement language={currentLanguage} />;
      case 'analytics':
        return <AnalyticsReporting language={currentLanguage} />;
      case 'content':
        return <ContentManagement language={currentLanguage} />;
      case 'settings':
        return <Settings language={currentLanguage} admin={currentAdmin} />;
      default:
        return <DashboardOverview language={currentLanguage} />;
    }
  };
  
  // Check permission for specific actions
  const hasPermission = (permission: string): boolean => {
    return currentAdmin.permissions.includes(permission) || 
           currentAdmin.role === 'super_admin';
  };
  
  return (
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <TopBar 
        admin={currentAdmin}
        notifications={notifications}
        language={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <Sidebar 
          activePage={activePage}
          onNavigate={setActivePage}
          permissions={currentAdmin.permissions}
          role={currentAdmin.role}
          language={currentLanguage}
        />
        
        {/* Main Content Area */}
        <main className="dashboard-content">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

// Slot Management Component Example
const SlotManagement: React.FC<{language: 'en' | 'fr'}> = ({language}) => {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  
  // Load slot data
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const {data, error} = await supabase
          .from('auction_slots')
          .select(`
            id,
            product_id,
            is_active,
            start_time,
            end_time,
            featured,
            view_count,
            products (
              id,
              name_en,
              name_fr,
              image_urls,
              price,
              currency,
              seller_id,
              seller_whatsapp,
              users (
                id, 
                name,
                whatsapp_number
              )
            )
          `)
          .order('id');
          
        if (error) throw error;
        setSlots(data || []);
        
        // Fetch pending products
        const {data: pendingData, error: pendingError} = await supabase
          .from('products')
          .select(`
            id,
            name_en,
            name_fr,
            image_urls,
            price,
            currency,
            created_at,
            seller_id,
            seller_whatsapp,
            users (
              id,
              name,
              whatsapp_number
            )
          `)
          .is('auction_slot_id', null)
          .eq('status', 'approved')
          .order('created_at');
          
        if (pendingError) throw pendingError;
        setPendingProducts(pendingData || []);
      } catch (error) {
        console.error('Error fetching slot data:', error);
        // Handle error state
      }
    };
    
    fetchSlots();
    
    // Subscribe to realtime updates
    const subscription = supabase
      .channel('slot-updates')
      .on('UPDATE', {event: 'UPDATE', schema: 'public', table: 'auction_slots'}, handleSlotUpdate)
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle dropping a product onto a slot
  const handleDropOnSlot = async (productId: string, slotId: number) => {
    try {
      // Update the slot with the new product
      const {error: slotError} = await supabase
        .from('auction_slots')
        .update({
          product_id: productId,
          is_active: true,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .eq('id', slotId);
        
      if (slotError) throw slotError;
      
      // Update the product with the slot ID
      const {error: productError} = await supabase
        .from('products')
        .update({
          auction_slot_id: slotId
        })
        .eq('id', productId);
        
      if (productError) throw productError;
      
      // Success notification
      toast.success(language === 'en' 
        ? `Product assigned to slot #${slotId}` 
        : `Produit assigné à l'emplacement #${slotId}`
      );
      
    } catch (error) {
      console.error('Error assigning product to slot:', error);
      toast.error(language === 'en'
        ? 'Failed to assign product to slot'
        : 'Échec de l\'attribution du produit à l\'emplacement'
      );
    }
  };
  
  // Handle creating a new product
  const handleCreateProduct = async (productData: ProductData) => {
    try {
      // Create the product in the database
      const {data, error} = await supabase
        .from('products')
        .insert({
          name_en: productData.name_en,
          name_fr: productData.name_fr,
          description_en: productData.description_en || '',
          description_fr: productData.description_fr || '',
          price: productData.price,
          currency: productData.currency,
          seller_whatsapp: productData.seller_whatsapp, // Direct WhatsApp association
          image_urls: productData.images,
          status: 'approved', // Auto-approve for MVP
          created_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      
      // Success notification
      toast.success(language === 'en' 
        ? 'Product created successfully' 
        : 'Produit créé avec succès'
      );
      
      // Add to pending products list
      setPendingProducts([...pendingProducts, data[0]]);
      
      // Close create form
      setIsCreatingProduct(false);
      
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(language === 'en'
        ? 'Failed to create product'
        : 'Échec de la création du produit'
      );
    }
  };
  
  return (
    <div className="slot-management">
      <header className="section-header">
        <h1>{language === 'en' ? 'Slot Management' : 'Gestion des Emplacements'}</h1>
        <div className="action-buttons">
          <button 
            className="create-product-button"
            onClick={() => setIsCreatingProduct(true)}
          >
            <PlusIcon />
            {language === 'en' ? 'Create Product' : 'Créer Produit'}
          </button>
          <button className="refresh-button" onClick={refreshSlotData}>
            <RefreshIcon />
            {language === 'en' ? 'Refresh' : 'Actualiser'}
          </button>
          <button className="schedule-button" onClick={() => setShowScheduler(true)}>
            <CalendarIcon />
            {language === 'en' ? 'Scheduler' : 'Planificateur'}
          </button>
        </div>
      </header>
      
      {/* Slot Grid */}
      <div className="slot-grid">
        {slots.map(slot => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onSelect={() => setSelectedSlot(slot.id)}
            onDrop={productId => handleDropOnSlot(productId, slot.id)}
            isSelected={selectedSlot === slot.id}
            language={language}
          />
        ))}
      </div>
      
      {/* Pending Products */}
      <div className="pending-products-section">
        <h2>{language === 'en' ? 'Available Products' : 'Produits Disponibles'}</h2>
        <div className="product-list">
          {pendingProducts.map(product => (
            <DraggableProductCard
              key={product.id}
              product={product}
              language={language}
              draggable={true}
              whatsappNumber={product.seller_whatsapp}
            />
          ))}
        </div>
      </div>
      
      {/* Create Product Modal */}
      {isCreatingProduct && (
        <Modal 
          title={language === 'en' ? 'Create New Product' : 'Créer Nouveau Produit'}
          onClose={() => setIsCreatingProduct(false)}
        >
          <ProductForm 
            onSubmit={handleCreateProduct}
            language={language}
          />
        </Modal>
      )}
      
      {/* Slot Detail Panel */}
      {selectedSlot !== null && (
        <SlotDetailPanel
          slot={slots.find(s => s.id === selectedSlot)!}
          onClose={() => setSelectedSlot(null)}
          onEdit={() => setIsEditing(true)}
          language={language}
        />
      )}
      
      {/* Edit Slot Modal */}
      {isEditing && selectedSlot !== null && (
        <EditSlotModal
          slot={slots.find(s => s.id === selectedSlot)!}
          onSave={handleSaveSlot}
          onCancel={() => setIsEditing(false)}
          language={language}
        />
      )}
    </div>
  );
};
```

## UI Design Specifications

### Color Scheme
- **Primary**: #1E3A8A (deep blue)
- **Secondary**: #3B82F6 (bright blue)
- **Success**: #10B981 (emerald green)
- **Warning**: #F59E0B (amber)
- **Danger**: #EF4444 (red)
- **Background**: #F3F4F6 (light gray)
- **Surface**: #FFFFFF (white)
- **Text**: #1F2937 (dark gray)
- **WhatsApp Green**: #25D366 (for WhatsApp actions)
- **Cash Payment Orange**: #F97316 (for payment indicators)
- **Verification Blue**: #3B82F6 (for verification badges)

### Typography
- **Headings**: Inter, 16-24px, semi-bold/bold
- **Body Text**: Inter, 14px, regular
- **Data Labels**: Inter, 12px, medium
- **Navigation**: Inter, 14px, medium
- **Alerts/Badges**: Inter, 12px, semi-bold

### Layout
- **Sidebar Width**: 240px (collapsed: 64px)
- **Topbar Height**: 64px
- **Content Padding**: 24px
- **Card Padding**: 16px
- **Grid Gaps**: 16px (24px on larger screens)
- **Breakpoints**:
  - Small: 768px
  - Medium: 1024px
  - Large: 1280px
  - Extra Large: 1536px

### Components
- **Cards**: Rounded corners (8px), subtle shadow
- **Buttons**: Rounded (6px), consistent padding (8px 16px)
- **Tables**: Alternating row colors, hover states
- **Forms**: Clear grouping, inline validation
- **Alerts**: Color-coded, dismissible
- **Modals**: Centered, backdrop blur, focused content
- **WhatsApp Elements**: Branded with WhatsApp green, recognizable icon

## Responsive Behavior

### Desktop Priority
- **Full Interface**: Complete feature set and comprehensive views
- **Multi-Panel Layout**: Side-by-side panels and tools
- **Advanced Controls**: Drag-and-drop, contextual actions
- **Keyboard Shortcuts**: Efficient operations for power users

### Tablet Adaptations
- **Collapsible Sidebar**: Toggle between full and icon-only
- **Simplified Layouts**: Single-column when necessary
- **Touch Optimization**: Larger hit areas for touch
- **Priority Information**: Focus on essential metrics

### Mobile (Limited Support)
- **Essential Features**: Core functionality only
- **Simplified Navigation**: Bottom bar or hamburger menu
- **Focused Views**: Single task at a time
- **Reduced Data Density**: Key information only

## Security Considerations

### Access Control
- **Role-Based Permissions**: Granular control over feature access
- **Action Logging**: Complete audit trail of admin activities
- **IP Restrictions**: Optional limitations on admin access locations
- **Session Management**: Timeouts and forced re-authentication

### Data Protection
- **Sensitive Data Handling**: Masking of critical information
- **Export Limitations**: Controls on bulk data exports
- **User Data Privacy**: Compliance with GDPR and local regulations
- **Encrypted Communications**: Secure transmission of all data
- **WhatsApp Number Protection**: Partial masking in public views

### Operations Security
- **Two-Step Verification**: For critical operations
- **Approval Workflows**: Multi-admin sign-off for major changes
- **Rollback Capabilities**: Ability to revert destructive actions
- **Emergency Controls**: Rapid response tools for security incidents

## Analytics & Reporting Capabilities

### Real-time Metrics
- **Dashboard Widgets**: Customizable metric displays
- **Refresh Controls**: Manual and auto-refresh options
- **Threshold Alerts**: Visual indicators for metrics outside norms
- **Trend Indicators**: Directional markers for changing metrics
- **WhatsApp Engagement Tracking**: Monitor conversation initiations

### Historical Data
- **Time-Based Filtering**: Daily, weekly, monthly, custom ranges
- **Comparative Analysis**: Period-over-period comparisons
- **Data Visualization**: Charts, graphs, and visual representations
- **Export Capabilities**: Data download in multiple formats

### Custom Reports
- **Report Builder**: UI for creating custom reports
- **Scheduled Reports**: Automated generation and delivery
- **Saved Templates**: Reusable report configurations
- **Multi-Format Output**: PDF, CSV, Excel, dashboard view

## Implementation Considerations

### Architecture
- **Component Modularity**: Independent dashboard sections
- **State Management**: Centralized for consistent data
- **API Integration**: RESTful endpoints for all operations
- **Realtime Updates**: WebSocket connections for live data
- **WhatsApp Integration**: Direct linking to WhatsApp web/app

### Performance
- **Data Caching**: Minimize redundant API calls
- **Pagination**: Handle large data sets efficiently
- **Lazy Loading**: Defer non-critical component loading
- **Optimistic Updates**: Immediate UI reflection before confirmation

### Internationalization
- **Language System**: Complete bilingual support
- **Locale-Aware Formatting**: Dates, times, numbers
- **Translation Management**: Externalized string resources
- **RTL Support**: Foundation for future language additions

### Accessibility
- **WCAG Compliance**: AA standard minimum
- **Keyboard Navigation**: Complete operations without mouse
- **Screen Reader Support**: Proper ARIA attributes
- **Focus Management**: Clear visual indicators

## Future Enhancements

### Advanced Analytics
- **Predictive Analytics**: ML-based trend forecasting
- **User Behavior Analysis**: Advanced journey mapping
- **Conversion Optimization**: A/B testing framework
- **Custom Metrics**: User-defined KPIs and tracking
- **WhatsApp Funnel Analysis**: Track conversation completion rates

### Automation
- **Intelligent Slot Assignment**: Algorithmic product placement
- **Content Moderation**: AI-assisted approval workflows
- **Smart Notifications**: Context-aware admin alerts
- **Scheduled Operations**: Time-based maintenance tasks
- **Automated WhatsApp Responses**: Template-based initial responses

### Integration Expansion
- **External Reporting Tools**: BI platform connections
- **CRM Integration**: Customer data synchronization
- **Additional Payment Systems**: Expanded payment options
- **Marketing Platforms**: Campaign management integration
- **Advanced WhatsApp Business API**: Multi-agent conversations

### Mobile Administration
- **Dedicated Admin App**: Native mobile experience
- **Push Notifications**: Real-time alerts for admins
- **Biometric Authentication**: Secure mobile access
- **Offline Capabilities**: Limited operations without connectivity
- **Direct WhatsApp App Integration**: Open WhatsApp with pre-filled messages

### Transaction Monitoring
- **Order Tracking**:
  - Cash on delivery confirmation logging
  - Delivery status tracking
  - Transaction completion verification
  - WhatsApp conversation analysis
  - Dispute resolution tools

### Advanced Verification
- **Enhanced Seller Verification**:
  - Multi-factor verification methods
  - ID document verification integration
  - Video verification calls
  - Business registration verification
  - WhatsApp Business account linking
  - Trust score algorithms based on verification level

### Payment Method Expansion
- **Additional Payment Options**:
  - Escrow payment system
  - Mobile money integration
  - Bank transfer support
  - Payment tracking dashboard
  - Transaction reconciliation tools

## Trust and Safety Features

### Seller Verification Dashboard
- **Verification Overview**:
  - Total verified vs. unverified sellers
  - Verification completion rate
  - WhatsApp verification success metrics
  - Verification level distribution
  - Recent verification activity

- **Verification Queue**:
  - Pending verification requests list
  - Priority sorting options
  - Batch verification actions
  - Verification history log
  - WhatsApp test results tracking

- **Verification Settings**:
  - Verification level requirements configuration
  - Required documentation settings
  - Automatic verification rules
  - WhatsApp verification procedures
  - Verification badge display settings

### Trust Management
- **Buyer Protection Features**:
  - Seller trust score display settings
  - Verified badge configuration
  - Reporting system for issues
  - Blocked seller management
  - WhatsApp number verification standards

- **Security Alerts**:
  - Suspicious activity detection
  - Multiple WhatsApp number change alerts
  - Account verification anomaly detection
  - Unusual product listing patterns
  - Geographic inconsistency warnings

This admin dashboard design provides SokoClick administrators with comprehensive tools to effectively manage the platform's 25 product slots, user accounts, and overall marketplace operations, with a focus on efficiency, clarity, and security. 