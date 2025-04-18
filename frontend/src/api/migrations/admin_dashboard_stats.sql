-- Migration: Create a view for admin dashboard statistics
-- Description: This creates a database view that provides aggregated statistics for the admin dashboard

-- Drop the view if it already exists to ensure migration is idempotent
DROP VIEW IF EXISTS public.admin_dashboard_stats;

-- Create the admin dashboard statistics view
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  -- User statistics
  (SELECT COUNT(*) FROM public.users) AS total_users,
  (SELECT COUNT(*) FROM public.users WHERE role = 'buyer') AS buyer_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'seller') AS seller_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'admin') AS admin_count,
  
  -- Auction statistics
  (SELECT COUNT(*) FROM public.auction_slots WHERE is_active = true) AS active_auctions,
  (SELECT COUNT(*) FROM public.auction_slots WHERE auction_state = 'completed') AS completed_auctions,
  (SELECT COUNT(*) FROM public.auction_slots WHERE auction_state = 'scheduled') AS scheduled_auctions,
  (SELECT COUNT(*) FROM public.auction_slots WHERE featured = true) AS featured_auctions,
  
  -- Transaction statistics
  (SELECT COALESCE(SUM(commission_amount), 0) FROM public.transactions) AS total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM public.transactions) AS transaction_volume,
  (SELECT COUNT(*) FROM public.transactions WHERE status IN ('payment_pending', 'shipping_pending')) AS pending_transactions,
  (SELECT COUNT(*) FROM public.transactions WHERE status = 'completed') AS completed_transactions,
  
  -- Product statistics
  (SELECT COUNT(*) FROM public.products) AS total_products,
  
  -- Last updated timestamp for cache busting
  NOW() AS last_updated;

-- Grant permissions
GRANT SELECT ON public.admin_dashboard_stats TO authenticated; 