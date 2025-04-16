import { AuctionSlot, Product, Profile } from '../types/supabase';

// Product categories
export const PRODUCT_CATEGORIES = [
  'electronics', 
  'smartphones', 
  'computers', 
  'cameras', 
  'audio', 
  'gaming',
  'home_appliances', 
  'fashion', 
  'watches', 
  'jewelry',
  'sports', 
  'collectibles', 
  'art'
];

// Product conditions
export const PRODUCT_CONDITIONS = [
  'New', 
  'Like New', 
  'Very Good', 
  'Good', 
  'Fair'
];

// Currencies
export const CURRENCIES = [
  'USD', 
  'EUR', 
  'GBP', 
  'KES', 
  'NGN', 
  'ZAR', 
  'XAF', 
  'XOF'
];

// Updated auction states with descriptions
export const AUCTION_STATES = {
  UPCOMING: 'upcoming', // Not yet started
  SCHEDULED: 'scheduled', // Scheduled but not started
  ACTIVE: 'active',     // Currently active
  PENDING: 'pending',   // Auction ended, waiting for payment/handover
  ENDED: 'ended',       // Auction has ended
  COMPLETED: 'completed', // Successfully completed
  CANCELLED: 'cancelled', // Cancelled by admin/seller
  FAILED: 'failed'      // No bids or buyer didn't complete
} as const;

// Create and export the AuctionState type
export type AuctionState = typeof AUCTION_STATES[keyof typeof AUCTION_STATES];

// Utility functions
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomPrice = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomViews = () => {
  // Generate views with a distribution that favors lower numbers
  // but occasionally has high-view items
  const base = randomNumber(10, 100);
  const isPopular = Math.random() < 0.2; // 20% chance of being popular
  return isPopular ? base * randomNumber(5, 20) : base;
};

const randomBool = (probability = 0.5) => {
  return Math.random() < probability;
};

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateId = (prefix: string, id: number): string => {
  const paddedId = String(id).padStart(4, '0');
  return `${prefix}-${paddedId}`;
};

// Generate the current time and useful time markers
const NOW = new Date();
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;

// Get a random time in the future between 1 hour and 2 weeks
const getRandomFutureTime = (maxDays = 14) => {
  const future = new Date(NOW.getTime() + randomNumber(1, maxDays) * ONE_DAY);
  return future;
};

// Get a random time in the past between 1 hour and 30 days
const getRandomPastTime = (maxDays = 30) => {
  const past = new Date(NOW.getTime() - randomNumber(1, maxDays) * ONE_DAY);
  return past;
};

// Calculate remaining time in hours
const getRemainingHours = (endTime: string): number => {
  const end = new Date(endTime).getTime();
  const now = NOW.getTime();
  return Math.max(0, (end - now) / ONE_HOUR);
};

// Generate time period based on auction state
const getTimePeriodsForState = (state: AuctionState): { startTime: string | null, endTime: string | null } => {
  switch (state) {
    case AUCTION_STATES.PENDING:
      // No times set yet
      return { startTime: null, endTime: null };
    
    case AUCTION_STATES.SCHEDULED:
      // Scheduled to start in the future (1-7 days)
      const scheduledStart = new Date(NOW.getTime() + randomNumber(1, 7) * ONE_DAY);
      const scheduledEnd = new Date(scheduledStart.getTime() + randomNumber(3, 10) * ONE_DAY);
      return { startTime: scheduledStart.toISOString(), endTime: scheduledEnd.toISOString() };
    
    case AUCTION_STATES.ACTIVE:
      // Started in the past, ends in the future
      const activeStart = getRandomPastTime(10);
      const activeEnd = getRandomFutureTime(14);
      return { startTime: activeStart.toISOString(), endTime: activeEnd.toISOString() };
    
    case AUCTION_STATES.ENDED:
      // Both start and end times are in the past
      const endedStart = getRandomPastTime(30);
      const endedEnd = new Date(endedStart.getTime() + randomNumber(3, 14) * ONE_DAY);
      // Make sure end time is in the past
      if (endedEnd > NOW) {
        endedEnd.setTime(NOW.getTime() - ONE_HOUR);
      }
      return { startTime: endedStart.toISOString(), endTime: endedEnd.toISOString() };
    
    case AUCTION_STATES.COMPLETED:
      // Completed auctions have both times in the past
      const completedStart = getRandomPastTime(30);
      const completedEnd = new Date(completedStart.getTime() + randomNumber(3, 14) * ONE_DAY);
      // Make sure end time is in the past
      if (completedEnd > NOW) {
        completedEnd.setTime(NOW.getTime() - ONE_DAY);
      }
      return { startTime: completedStart.toISOString(), endTime: completedEnd.toISOString() };
    
    case AUCTION_STATES.CANCELLED:
      // Cancelled auctions typically have a start time but end time is when it was cancelled
      const cancelledStart = getRandomPastTime(30);
      const cancelTime = new Date(cancelledStart.getTime() + randomNumber(1, 7) * ONE_DAY);
      // Make sure cancellation time is in the past
      if (cancelTime > NOW) {
        cancelTime.setTime(NOW.getTime() - ONE_DAY);
      }
      return { startTime: cancelledStart.toISOString(), endTime: cancelTime.toISOString() };
  }
  // Default fallback if no match
  return { startTime: null, endTime: null };
};

// SELLER PROFILES
export const MOCK_SELLERS: Profile[] = [
  // System Admin Accounts
  {
    id: 'admin-001',
    email: 'sokoclick.com@gmail.com',
    whatsapp_number: '+23765000001',
    display_name: 'SokoClick Admin',
    location: 'Douala, Cameroon',
    rating: 5.0,
    joined_date: getRandomPastTime(365).toISOString(),
    bio: 'System administrator for SokoClick platform.',
    profile_image: 'https://randomuser.me/api/portraits/men/30.jpg',
    verified: true,
    role: 'admin'
  },
  {
    id: 'admin-002',
    email: 'strength.cm@gmail.com',
    whatsapp_number: '+23765000002',
    display_name: 'Strength Admin',
    location: 'Yaounde, Cameroon',
    rating: 5.0,
    joined_date: getRandomPastTime(365).toISOString(),
    bio: 'System administrator for SokoClick platform.',
    profile_image: 'https://randomuser.me/api/portraits/men/31.jpg',
    verified: true,
    role: 'admin'
  },
  {
    id: 'prof-001',
    email: 'john.doe@example.com',
    whatsapp_number: '+254712345678',
    display_name: 'John Doe',
    location: 'Nairobi, Kenya',
    rating: 4.8,
    joined_date: getRandomPastTime(365).toISOString(),
    bio: 'Trusted seller of electronics and gadgets. Fast shipping and quality products guaranteed.',
    profile_image: 'https://randomuser.me/api/portraits/men/1.jpg',
    verified: true
  },
  {
    id: 'prof-002',
    email: 'mary.smith@example.com',
    whatsapp_number: '+254723456789',
    display_name: 'Mary Smith',
    location: 'Lagos, Nigeria',
    rating: 4.9,
    joined_date: getRandomPastTime(365).toISOString(),
    bio: 'Smartphone and computer specialist. All items tested and verified before listing.',
    profile_image: 'https://randomuser.me/api/portraits/women/2.jpg',
    verified: true
  },
  {
    id: 'prof-003',
    email: 'david.ngugi@example.com',
    whatsapp_number: '+254734567890',
    display_name: 'David Ngugi',
    location: 'Mombasa, Kenya',
    rating: 4.7,
    joined_date: getRandomPastTime(180).toISOString(),
    bio: 'Photography enthusiast selling professional camera equipment. Detailed descriptions and honest condition reports.',
    profile_image: 'https://randomuser.me/api/portraits/men/3.jpg',
    verified: false
  },
  {
    id: 'prof-004',
    email: 'amina.diallo@example.com',
    whatsapp_number: '+221777654321',
    display_name: 'Amina Diallo',
    location: 'Dakar, Senegal',
    rating: 4.6,
    joined_date: getRandomPastTime(120).toISOString(),
    bio: 'Fashion dealer specializing in authentic designer items and jewelry. All items come with proof of authenticity.',
    profile_image: 'https://randomuser.me/api/portraits/women/4.jpg',
    verified: true
  },
  {
    id: 'prof-005',
    email: 'samuel.okafor@example.com',
    whatsapp_number: '+234812345678',
    display_name: 'Samuel Okafor',
    location: 'Abuja, Nigeria',
    rating: 4.5,
    joined_date: getRandomPastTime(90).toISOString(),
    bio: 'Tech enthusiast selling gaming equipment and accessories. Fast delivery and competitive pricing.',
    profile_image: 'https://randomuser.me/api/portraits/men/5.jpg',
    verified: true
  },
  {
    id: 'prof-006',
    email: 'grace.wong@example.com',
    whatsapp_number: '+233557654321',
    display_name: 'Grace Wong',
    location: 'Accra, Ghana',
    rating: 4.9,
    joined_date: getRandomPastTime(150).toISOString(),
    bio: 'Art collector and dealer. Specializing in contemporary African art and collectibles.',
    profile_image: 'https://randomuser.me/api/portraits/women/6.jpg',
    verified: true
  },
  {
    id: 'prof-007',
    email: 'eric.mutai@example.com',
    whatsapp_number: '+254745678901',
    display_name: 'Eric Mutai',
    location: 'Nakuru, Kenya',
    rating: 4.3,
    joined_date: getRandomPastTime(60).toISOString(),
    bio: 'Sports equipment seller. From football to tennis, I have quality gear for all sports enthusiasts.',
    profile_image: 'https://randomuser.me/api/portraits/men/7.jpg',
    verified: false
  },
  {
    id: 'prof-008',
    email: 'fatima.ba@example.com',
    whatsapp_number: '+221788765432',
    display_name: 'Fatima Ba',
    location: 'Dakar, Senegal',
    rating: 4.7,
    joined_date: getRandomPastTime(200).toISOString(),
    bio: 'Home appliance specialist. All products tested and in excellent working condition.',
    profile_image: 'https://randomuser.me/api/portraits/women/8.jpg',
    verified: true
  },
  {
    id: 'prof-009',
    email: 'kofi.mensah@example.com',
    whatsapp_number: '+233244567890',
    display_name: 'Kofi Mensah',
    location: 'Kumasi, Ghana',
    rating: 4.4,
    joined_date: getRandomPastTime(110).toISOString(),
    bio: 'Watch collector selling authentic timepieces. Each watch comes with original box and papers.',
    profile_image: 'https://randomuser.me/api/portraits/men/9.jpg',
    verified: true
  },
  {
    id: 'prof-010',
    email: 'zainab.ibrahim@example.com',
    whatsapp_number: '+234912345678',
    display_name: 'Zainab Ibrahim',
    location: 'Kano, Nigeria',
    rating: 4.8,
    joined_date: getRandomPastTime(175).toISOString(),
    bio: 'Fashion designer selling unique handcrafted items. Each piece is one-of-a-kind.',
    profile_image: 'https://randomuser.me/api/portraits/women/10.jpg',
    verified: true
  }
];

// MOCK PRODUCTS (30+ items across multiple categories)
export const MOCK_PRODUCTS: Product[] = [
  // SMARTPHONES
  {
    id: 'prod-001',
    name_en: 'iPhone 13 Pro Max',
    name_fr: 'iPhone 13 Pro Max',
    description_en: 'Apple iPhone 13 Pro Max in excellent condition. 256GB storage, Pacific Blue color. Comes with original charger and box.',
    description_fr: 'Apple iPhone 13 Pro Max en excellent état. 256 Go de stockage, couleur bleu pacifique. Livré avec chargeur et boîte d\'origine.',
    image_urls: [
      'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1036&q=80',
      'https://images.unsplash.com/photo-1592286927505-1def25115611?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=868&q=80'
    ],
    starting_price: 85000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-001',
    seller_whatsapp: '+254712345678',
    seller: MOCK_SELLERS[0],
    category: 'smartphones',
    approved: true
  },
  {
    id: 'prod-002',
    name_en: 'Samsung Galaxy S22 Ultra',
    name_fr: 'Samsung Galaxy S22 Ultra',
    description_en: 'Samsung Galaxy S22 Ultra with 512GB storage, Phantom Black. 108MP camera, S Pen included. Minor scratches on back panel.',
    description_fr: 'Samsung Galaxy S22 Ultra avec 512 Go de stockage, Phantom Black. Caméra 108MP, S Pen inclus. Légères rayures sur le panneau arrière.',
    image_urls: [
      'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1553179459-4514c0f52f41?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1036&q=80'
    ],
    starting_price: 78000,
    currency: 'KES',
    condition: 'Good',
    seller_id: 'prof-002',
    seller_whatsapp: '+254723456789',
    seller: MOCK_SELLERS[1],
    category: 'smartphones',
    approved: true
  },
  {
    id: 'prod-003',
    name_en: 'Google Pixel 7 Pro',
    name_fr: 'Google Pixel 7 Pro',
    description_en: 'Google Pixel 7 Pro, 128GB, Obsidian Black. Excellent camera and battery life. Minor wear on edges, screen in perfect condition.',
    description_fr: 'Google Pixel 7 Pro, 128 Go, Noir Obsidienne. Excellente caméra et autonomie de batterie. Légère usure sur les bords, écran en parfait état.',
    image_urls: [
      'https://images.unsplash.com/photo-1667372393119-3d4c48242469?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
      'https://images.unsplash.com/photo-1667372393080-11eb8ad7a5a4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80'
    ],
    starting_price: 65000,
    currency: 'KES',
    condition: 'Very Good',
    seller_id: 'prof-009',
    seller_whatsapp: '+233244567890',
    seller: MOCK_SELLERS[8],
    category: 'smartphones',
    approved: true
  },
  {
    id: 'prod-004',
    name_en: 'OnePlus 10 Pro',
    name_fr: 'OnePlus 10 Pro',
    description_en: 'OnePlus 10 Pro 5G Smartphone, 256GB, 12GB RAM, Volcanic Black. Used for 6 months, no visible wear, comes with original accessories.',
    description_fr: 'Smartphone OnePlus 10 Pro 5G, 256 Go, 12 Go RAM, Noir Volcanique. Utilisé pendant 6 mois, aucune usure visible, livré avec accessoires d\'origine.',
    image_urls: [
      'https://images.unsplash.com/photo-1586183189334-43d3b934261b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80'
    ],
    starting_price: 55000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-005',
    seller_whatsapp: '+234812345678',
    seller: MOCK_SELLERS[4],
    category: 'smartphones',
    approved: true
  },
  
  // COMPUTERS
  {
    id: 'prod-005',
    name_en: 'MacBook Pro 16" M1 Pro',
    name_fr: 'MacBook Pro 16" M1 Pro',
    description_en: 'Apple MacBook Pro 16" with M1 Pro chip, 16GB RAM, 1TB SSD. Space Gray. Less than 1 year old, perfect working condition.',
    description_fr: 'Apple MacBook Pro 16" avec puce M1 Pro, 16 Go de RAM, 1 To SSD. Gris sidéral. Moins d\'un an, parfait état de fonctionnement.',
    image_urls: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80'
    ],
    starting_price: 195000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-003',
    seller_whatsapp: '+254734567890',
    seller: MOCK_SELLERS[2],
    category: 'computers',
    approved: true
  },
  {
    id: 'prod-006',
    name_en: 'Dell XPS 15 9510',
    name_fr: 'Dell XPS 15 9510',
    description_en: 'Dell XPS 15 9510, 11th Gen Intel i9, 32GB RAM, 1TB SSD, RTX 3050 Ti. 4K OLED display, perfect condition, under warranty.',
    description_fr: 'Dell XPS 15 9510, Intel i9 11e génération, 32 Go RAM, 1 To SSD, RTX 3050 Ti. Écran OLED 4K, parfait état, sous garantie.',
    image_urls: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1032&q=80'
    ],
    starting_price: 175000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-002',
    seller_whatsapp: '+254723456789',
    seller: MOCK_SELLERS[1],
    category: 'computers',
    approved: true
  },
  
  // CAMERAS
  {
    id: 'prod-007',
    name_en: 'Canon EOS R5 Camera',
    name_fr: 'Appareil Photo Canon EOS R5',
    description_en: 'Canon EOS R5 Mirrorless Camera with RF 24-105mm F4 L IS USM lens. 45MP, 8K video. Includes extra battery, 128GB CF Express card, and camera bag.',
    description_fr: 'Appareil photo sans miroir Canon EOS R5 avec objectif RF 24-105mm F4 L IS USM. 45MP, vidéo 8K. Comprend une batterie supplémentaire, une carte CF Express 128 Go et un sac pour appareil photo.',
    image_urls: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
      'https://images.unsplash.com/photo-1542879438-db3b7ef41c75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    ],
    starting_price: 350000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-002',
    seller_whatsapp: '+254723456789',
    seller: MOCK_SELLERS[1],
    category: 'cameras',
    approved: true
  },
  
  // DRONES
  {
    id: 'prod-008',
    name_en: 'DJI Mavic 3 Drone',
    name_fr: 'Drone DJI Mavic 3',
    description_en: 'DJI Mavic 3 Drone with Hasselblad camera, 4/3 CMOS, 28x zoom. Includes Fly More Combo with extra batteries, ND filters, and carrying case.',
    description_fr: 'Drone DJI Mavic 3 avec caméra Hasselblad, CMOS 4/3, zoom 28x. Comprend le Fly More Combo avec des batteries supplémentaires, des filtres ND et un étui de transport.',
    image_urls: [
      'https://images.unsplash.com/photo-1627263169653-7a9c29b8d6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1579829366248-204fe8413f31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    ],
    starting_price: 230000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-003',
    seller_whatsapp: '+254734567890',
    seller: MOCK_SELLERS[2],
    category: 'cameras',
    approved: true
  },
  
  // GAMING
  {
    id: 'prod-009',
    name_en: 'Sony PlayStation 5 Digital Edition',
    name_fr: 'Sony PlayStation 5 Édition Numérique',
    description_en: 'PS5 Digital Edition, 825GB SSD. Includes 2 DualSense controllers and 3 games (FIFA 23, Spider-Man: Miles Morales, and Demon\'s Souls).',
    description_fr: 'PS5 Édition Numérique, SSD 825 Go. Comprend 2 manettes DualSense et 3 jeux (FIFA 23, Spider-Man: Miles Morales et Demon\'s Souls).',
    image_urls: [
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=627&q=80',
      'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    ],
    starting_price: 65000,
    currency: 'KES',
    condition: 'Good',
    seller_id: 'prof-001',
    seller_whatsapp: '+254712345678',
    seller: MOCK_SELLERS[0],
    category: 'gaming',
    approved: true
  },
  {
    id: 'prod-010',
    name_en: 'Xbox Series X',
    name_fr: 'Xbox Series X',
    description_en: 'Xbox Series X 1TB, barely used. Comes with 2 controllers, charging dock, and 5 games including Halo Infinite and Forza Horizon 5.',
    description_fr: 'Xbox Series X 1 To, très peu utilisée. Livrée avec 2 manettes, station de charge et 5 jeux dont Halo Infinite et Forza Horizon 5.',
    image_urls: [
      'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1032&q=80',
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1619&q=80'
    ],
    starting_price: 60000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-005',
    seller_whatsapp: '+234812345678',
    seller: MOCK_SELLERS[4],
    category: 'gaming',
    approved: true
  },
  
  // WATCHES
  {
    id: 'prod-011',
    name_en: 'Rolex Submariner Date',
    name_fr: 'Rolex Submariner Date',
    description_en: 'Rolex Submariner Date, Ref. 126610LN, purchased in 2021. Excellent condition with minimal wear. Comes with all papers, box, and remaining warranty.',
    description_fr: 'Rolex Submariner Date, Réf. 126610LN, achetée en 2021. Excellent état avec usure minimale. Livrée avec tous les papiers, boîte et garantie restante.',
    image_urls: [
      'https://images.unsplash.com/photo-1526045431048-f857369baa09?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1548171562-f345eedccca4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80'
    ],
    starting_price: 1200000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-009',
    seller_whatsapp: '+233244567890',
    seller: MOCK_SELLERS[8],
    category: 'watches',
    approved: true
  },
  
  // AUDIO
  {
    id: 'prod-012',
    name_en: 'Bose QuietComfort 45 Headphones',
    name_fr: 'Casque Bose QuietComfort 45',
    description_en: 'Bose QuietComfort 45 wireless noise cancelling headphones. Black color, purchased 6 months ago, in perfect condition.',
    description_fr: 'Casque sans fil à réduction de bruit Bose QuietComfort 45. Couleur noire, acheté il y a 6 mois, en parfait état.',
    image_urls: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1165&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=739&q=80'
    ],
    starting_price: 35000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-004',
    seller_whatsapp: '+221777654321',
    seller: MOCK_SELLERS[3],
    category: 'audio',
    approved: true
  },
  
  // HOME APPLIANCES
  {
    id: 'prod-013',
    name_en: 'Dyson V11 Absolute Vacuum',
    name_fr: 'Aspirateur Dyson V11 Absolute',
    description_en: 'Dyson V11 Absolute cordless vacuum. Powerful suction, full set of attachments. Purchased 4 months ago, excellent condition.',
    description_fr: 'Aspirateur sans fil Dyson V11 Absolute. Aspiration puissante, jeu complet d\'accessoires. Acheté il y a 4 mois, excellent état.',
    image_urls: [
      'https://images.unsplash.com/photo-1662380840228-2b2ee9c6c9ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80'
    ],
    starting_price: 45000,
    currency: 'KES',
    condition: 'Like New',
    seller_id: 'prof-008',
    seller_whatsapp: '+221788765432',
    seller: MOCK_SELLERS[7],
    category: 'home_appliances',
    approved: true
  },
  
  // SPORTS EQUIPMENT
  {
    id: 'prod-014',
    name_en: 'Wilson Pro Staff RF97 Tennis Racket',
    name_fr: 'Raquette de Tennis Wilson Pro Staff RF97',
    description_en: 'Wilson Pro Staff RF97 Autograph Tennis Racket, Roger Federer signature model. Light use, no damage, includes original cover.',
    description_fr: 'Raquette de Tennis Wilson Pro Staff RF97 Autograph, modèle signature Roger Federer. Légèrement utilisée, aucun dommage, incluant la housse d\'origine.',
    image_urls: [
      'https://images.unsplash.com/photo-1617083934777-8fa4583ceb3b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    ],
    starting_price: 25000,
    currency: 'KES',
    condition: 'Very Good',
    seller_id: 'prof-007',
    seller_whatsapp: '+254745678901',
    seller: MOCK_SELLERS[6],
    category: 'sports',
    approved: true
  },
  
  // FASHION
  {
    id: 'prod-015',
    name_en: 'Louis Vuitton Neverfull MM Bag',
    name_fr: 'Sac Louis Vuitton Neverfull MM',
    description_en: 'Authentic Louis Vuitton Neverfull MM in Damier Ebene canvas. Purchased in 2020, lightly used, excellent condition. Comes with dust bag and receipt.',
    description_fr: 'Authentique Louis Vuitton Neverfull MM en toile Damier Ébène. Acheté en 2020, peu utilisé, excellent état. Livré avec housse antipoussiére et facture.',
    image_urls: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80'
    ],
    starting_price: 150000,
    currency: 'KES',
    condition: 'Very Good',
    seller_id: 'prof-010',
    seller_whatsapp: '+234912345678',
    seller: MOCK_SELLERS[9],
    category: 'fashion',
    approved: true
  }
];

// Function to generate a mock auction slot with a specific state
const generateMockAuctionSlot = (
  id: number, 
  state: AuctionState = AUCTION_STATES.ACTIVE, 
  product: Product | null = null, 
  isFeatured: boolean = false
): AuctionSlot => {
  // Get appropriate time periods based on the state
  const { startTime, endTime } = getTimePeriodsForState(state);
  
  // If no product is provided, return an empty slot
  if (!product) {
    return {
      id,
      product_id: null,
      is_active: state === AUCTION_STATES.ACTIVE || state === AUCTION_STATES.SCHEDULED,
      start_time: startTime,
      end_time: endTime,
      featured: false,
      view_count: 0,
      product: null,
      auction_state: state
    };
  }

  return {
    id,
    product_id: product.id,
    is_active: state === AUCTION_STATES.ACTIVE || state === AUCTION_STATES.SCHEDULED,
    start_time: startTime,
    end_time: endTime,
    featured: isFeatured,
    view_count: randomViews(),
    product: product,
    auction_state: state
  };
};

// Improve the distribution of auction states for more realism
export function generateMockAuctionSlots(count = 25): AuctionSlot[] {
  const now = new Date();
  
  // Create a distribution of auction states
  // 20% upcoming, 30% active, 20% pending, 15% completed, 10% cancelled, 5% failed
  const stateDistribution = {
    [AUCTION_STATES.UPCOMING]: 0.20,
    [AUCTION_STATES.ACTIVE]: 0.30,
    [AUCTION_STATES.PENDING]: 0.20,
    [AUCTION_STATES.COMPLETED]: 0.15,
    [AUCTION_STATES.CANCELLED]: 0.10,
    [AUCTION_STATES.FAILED]: 0.05
  };
  
  return Array.from({ length: count }, (_, index) => {
    // Select a product
    const productIndex = randomNumber(0, MOCK_PRODUCTS.length - 1);
    const product = MOCK_PRODUCTS[productIndex];
    
    // Determine the state based on distribution
    let auctionState: AuctionState = AUCTION_STATES.ACTIVE; // Default initialization
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    
    for (const [state, probability] of Object.entries(stateDistribution)) {
      cumulativeProbability += probability;
      if (randomValue <= cumulativeProbability) {
        auctionState = state as AuctionState;
        break;
      }
    }
    
    // Generate appropriate timestamps based on state
    let startTime: Date;
    let endTime: Date;
    let createdAt = new Date(now.getTime() - randomNumber(1, 30) * 24 * 60 * 60 * 1000); // 1-30 days ago
    
    switch (auctionState) {
      case AUCTION_STATES.UPCOMING:
        startTime = new Date(now.getTime() + randomNumber(1, 72) * 60 * 60 * 1000); // 1-72 hours in future
        endTime = new Date(startTime.getTime() + randomNumber(24, 168) * 60 * 60 * 1000); // 1-7 days after start
        break;
      case AUCTION_STATES.ACTIVE:
        startTime = new Date(now.getTime() - randomNumber(1, 72) * 60 * 60 * 1000); // 1-72 hours ago
        endTime = new Date(now.getTime() + randomNumber(1, 72) * 60 * 60 * 1000); // 1-72 hours in future
        break;
      case AUCTION_STATES.PENDING:
        startTime = new Date(now.getTime() - randomNumber(73, 168) * 60 * 60 * 1000); // 73-168 hours ago
        endTime = new Date(now.getTime() - randomNumber(1, 48) * 60 * 60 * 1000); // 1-48 hours ago
        break;
      case AUCTION_STATES.COMPLETED:
        startTime = new Date(now.getTime() - randomNumber(168, 720) * 60 * 60 * 1000); // 7-30 days ago
        endTime = new Date(now.getTime() - randomNumber(49, 168) * 60 * 60 * 1000); // 2-7 days ago
        break;
      case AUCTION_STATES.CANCELLED:
      case AUCTION_STATES.FAILED:
        startTime = new Date(now.getTime() - randomNumber(73, 240) * 60 * 60 * 1000); // 3-10 days ago
        endTime = new Date(now.getTime() - randomNumber(1, 72) * 60 * 60 * 1000); // 1-3 days ago
        break;
      default:
        startTime = new Date(now.getTime() - randomNumber(24, 48) * 60 * 60 * 1000);
        endTime = new Date(now.getTime() + randomNumber(24, 48) * 60 * 60 * 1000);
    }
    
    // Generate bids based on state
    const bidCount = auctionState === AUCTION_STATES.UPCOMING ? 0 : 
                     auctionState === AUCTION_STATES.FAILED ? 0 :
                     randomNumber(0, 15);
    
    const currentPrice = bidCount > 0 ? 
      product.starting_price + (bidCount * randomNumber(5, 20)) : 
      product.starting_price;
    
    // Generate a buyer for completed/pending auctions
    const buyerId = (auctionState === AUCTION_STATES.COMPLETED || auctionState === AUCTION_STATES.PENDING) ? 
      MOCK_SELLERS[randomNumber(0, MOCK_SELLERS.length - 1)].id : 
      null;
    
    // Random chance for a slot to be featured (only active ones)
    const isFeatured = auctionState === AUCTION_STATES.ACTIVE && Math.random() < 0.2; // 20% chance for active slots
    
    return {
      id: index + 1,
      product_id: product.id,
      seller_id: product.seller_id,
      auction_state: auctionState,
      is_active: auctionState === AUCTION_STATES.ACTIVE || auctionState === AUCTION_STATES.SCHEDULED,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      current_price: currentPrice,
      currency: product.currency,
      bid_count: bidCount,
      view_count: randomNumber(bidCount * 3, bidCount * 10 + 50),
      buyer_id: buyerId,
      created_at: createdAt.toISOString(),
      updated_at: new Date().toISOString(),
      product: product,
      featured: isFeatured,
      seller: MOCK_SELLERS.find(seller => seller.id === product.seller_id) || MOCK_SELLERS[0],
      buyer: buyerId ? MOCK_SELLERS.find(seller => seller.id === buyerId) : null
    };
  });
}

// Function to get mock auction slot by ID
export const getMockAuctionSlotById = (slotId: number): AuctionSlot | null => {
  const slots = generateMockAuctionSlots();
  return slots.find(slot => slot.id === slotId) || null;
};

// Function to get mock featured slots
export const getMockFeaturedSlots = (limit = 3): AuctionSlot[] => {
  const allSlots = generateMockAuctionSlots();
  return allSlots
    .filter(slot => slot.featured && slot.auction_state === AUCTION_STATES.ACTIVE)
    .slice(0, limit);
};

// Mock auction service methods to simulate backend API
export const mockAuctionService = {
  getAuctionSlots: (limit: number = 25, offset: number = 0): Promise<AuctionSlot[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSlots = generateMockAuctionSlots();
        resolve(allSlots.slice(offset, offset + limit));
      }, 300); // Simulate network delay
    });
  },
  
  getAuctionSlotById: (id: number): Promise<AuctionSlot | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getMockAuctionSlotById(id));
      }, 300);
    });
  },
  
  increaseViewCount: (id: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, this would update the database
        // For mock data, we don't need to do anything since we regenerate the data
        resolve();
      }, 200);
    });
  },
  
  // Get all products
  getMockProducts: (): Promise<Product[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_PRODUCTS);
      }, 300);
    });
  },
  
  // Admin methods
  assignProductToSlot: (slotId: number, productId: string): Promise<AuctionSlot> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const slot = getMockAuctionSlotById(slotId);
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        
        if (!slot) {
          reject(new Error(`Slot with ID ${slotId} not found`));
          return;
        }
        
        if (!product) {
          reject(new Error(`Product with ID ${productId} not found`));
          return;
        }
        
        // Create an updated slot
        const updatedSlot: AuctionSlot = {
          ...slot,
          product_id: product.id,
          product: product,
          auction_state: AUCTION_STATES.SCHEDULED,
          is_active: true
        };
        
        resolve(updatedSlot);
      }, 500);
    });
  },
  
  removeProductFromSlot: (slotId: number): Promise<AuctionSlot> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const slot = getMockAuctionSlotById(slotId);
        
        if (!slot) {
          reject(new Error(`Slot with ID ${slotId} not found`));
          return;
        }
        
        // Create an updated slot with no product
        const updatedSlot: AuctionSlot = {
          ...slot,
          product_id: null,
          product: null,
          auction_state: AUCTION_STATES.PENDING,
          is_active: false
        };
        
        resolve(updatedSlot);
      }, 500);
    });
  },
  
  updateSlotDetails: (slotId: number, details: Partial<AuctionSlot>): Promise<AuctionSlot> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const slot = getMockAuctionSlotById(slotId);
        
        if (!slot) {
          reject(new Error(`Slot with ID ${slotId} not found`));
          return;
        }
        
        // Create an updated slot with the new details
        const updatedSlot: AuctionSlot = {
          ...slot,
          ...details
        };
        
        resolve(updatedSlot);
      }, 500);
    });
  },
  
  // New method to transition an auction slot to a different state
  transitionAuctionSlot: async (id: number, newState: AuctionState): Promise<AuctionSlot | null> => {
    const slot = await mockAuctionService.getAuctionSlotById(id);
    
    if (!slot) {
      return null;
    }
    
    // Validate state transitions
    const validTransitions: Record<AuctionState, AuctionState[]> = {
      [AUCTION_STATES.UPCOMING]: [AUCTION_STATES.ACTIVE, AUCTION_STATES.CANCELLED],
      [AUCTION_STATES.SCHEDULED]: [AUCTION_STATES.ACTIVE, AUCTION_STATES.CANCELLED],
      [AUCTION_STATES.ACTIVE]: [AUCTION_STATES.PENDING, AUCTION_STATES.FAILED, AUCTION_STATES.CANCELLED],
      [AUCTION_STATES.PENDING]: [AUCTION_STATES.COMPLETED, AUCTION_STATES.FAILED, AUCTION_STATES.CANCELLED],
      [AUCTION_STATES.COMPLETED]: [],
      [AUCTION_STATES.ENDED]: [AUCTION_STATES.COMPLETED, AUCTION_STATES.FAILED],
      [AUCTION_STATES.CANCELLED]: [],
      [AUCTION_STATES.FAILED]: [AUCTION_STATES.ACTIVE] // Allow reactivation of failed auctions
    };
    
    // Make sure slot.auction_state exists and is a valid key
    const currentState = slot.auction_state as AuctionState;
    if (!currentState || !validTransitions[currentState]) {
      throw new Error(`Invalid auction state: ${currentState}`);
    }
    
    if (!validTransitions[currentState].includes(newState)) {
      throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
    }
    
    // Update the state
    const updatedSlot = {
      ...slot,
      auction_state: newState,
      updated_at: new Date().toISOString()
    };
    
    // We don't actually modify the MOCK_AUCTION_SLOTS since we regenerate them each time
    // This is just a simulation
    
    return updatedSlot;
  },
  
  // New method to simulate auction completion
  completeAuction: async (id: number, buyerId: string): Promise<AuctionSlot | null> => {
    const slot = await mockAuctionService.getAuctionSlotById(id);
    
    if (!slot) {
      return null;
    }
    
    // Ensure we're checking auction_state correctly
    if (slot.auction_state !== AUCTION_STATES.ACTIVE) {
      return null;
    }
    
    const buyer = MOCK_SELLERS.find(seller => seller.id === buyerId);
    if (!buyer) {
      return null;
    }
    
    // Update the slot to pending status
    const updatedSlot = {
      ...slot,
      auction_state: AUCTION_STATES.PENDING,
      buyer_id: buyerId,
      buyer: buyer,
      updated_at: new Date().toISOString(),
      end_time: new Date().toISOString() // End the auction now
    };
    
    // We don't actually modify the MOCK_AUCTION_SLOTS since we regenerate them each time
    // This is just a simulation
    
    return updatedSlot;
  },
  
  // Get products by seller ID
  getProductsBySellerId: (sellerId: string): Promise<Product[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sellerProducts = MOCK_PRODUCTS.filter(product => product.seller_id === sellerId);
        resolve(sellerProducts);
      }, 300);
    });
  },
  
  // Get auction slots by seller ID
  getAuctionSlotsBySellerId: (sellerId: string): Promise<AuctionSlot[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSlots = generateMockAuctionSlots();
        const sellerSlots = allSlots.filter(slot => slot.product?.seller_id === sellerId);
        resolve(sellerSlots);
      }, 300);
    });
  }
};

// Initialize the mock auction slots
// Not actually needed since we generate slots on-demand 