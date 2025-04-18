# Fixing the Supabase Schema for SokoClick

The error `Could not find a relationship between 'auction_slots' and 'users' in the schema cache` indicates that there's a missing relationship in the Supabase database schema that needs to be fixed.

## Option 1: Run this SQL directly in the Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL commands:

```sql
-- Add seller_id and buyer_id columns if they don't exist
ALTER TABLE IF EXISTS public.auction_slots 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS auction_state TEXT DEFAULT 'scheduled';

-- Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auction_slots_seller_id ON public.auction_slots(seller_id);
CREATE INDEX IF NOT EXISTS idx_auction_slots_buyer_id ON public.auction_slots(buyer_id);

-- Create view for easier access to joined data
CREATE OR REPLACE VIEW public.auction_slots_with_relations AS
SELECT 
    a.*,
    p.name_en AS product_name_en,
    p.name_fr AS product_name_fr,
    p.image_urls AS product_image_urls,
    p.starting_price,
    p.seller_id AS product_seller_id,
    s.email AS seller_email,
    s.whatsapp_number AS seller_whatsapp,
    b.email AS buyer_email
FROM 
    public.auction_slots a
LEFT JOIN 
    public.products p ON a.product_id = p.id
LEFT JOIN 
    public.users s ON a.seller_id = s.id
LEFT JOIN 
    public.users b ON a.buyer_id = b.id;

-- Grant permissions
GRANT SELECT ON public.auction_slots_with_relations TO anon, authenticated;
```

4. After running the SQL, refresh the Supabase UI and check if the relationships are properly shown

## Option 2: Update Column Relationships via UI

If the automatic migration doesn't work, you can manually update the relationships:

1. Go to the Supabase dashboard
2. Navigate to the Table Editor
3. Select the `auction_slots` table
4. Find or add the `seller_id` and `buyer_id` columns
5. Click on each column and set them as Foreign Keys pointing to the `id` column in the `users` table

## Verifying the Fix

After applying either fix, you should be able to:

1. Refresh your application
2. Go to the homepage and see auction slots loading properly
3. Check the browser console to ensure there are no relationship errors

If you continue to have issues, try removing the Supabase cache:

```sql
-- Clear Supabase schema cache (Admin API)
SELECT schema_cache.clear();
```

Note: This requires admin privileges on the Supabase project. 