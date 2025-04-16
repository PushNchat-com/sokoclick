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