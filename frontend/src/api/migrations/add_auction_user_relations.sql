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