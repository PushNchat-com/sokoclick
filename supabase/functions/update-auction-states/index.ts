// Edge Function: update-auction-states
// Description: Updates auction states based on their start_time and end_time
// This function runs on a schedule to ensure auction states are always current

import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// Constants for auction states
const AUCTION_STATES = {
  UPCOMING: 'upcoming',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PENDING: 'pending',
  ENDED: 'ended',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Initialize Supabase client 
// Environment variables are automatically available
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Create supabase client with admin rights
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.info('Auction state update function started');

Deno.serve(async (req: Request) => {
  try {
    // Check for API key authentication if needed for extra security
    // This is optional since this should be an internal function
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("apiKey");
    
    // You can set a secret API key as an environment variable for added security
    const expectedApiKey = Deno.env.get("UPDATE_FUNCTION_API_KEY");
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all active auction slots
    const { data: auctionSlots, error: fetchError } = await supabase
      .from('auction_slots')
      .select('*')
      .eq('is_active', true);
    
    if (fetchError) {
      throw new Error(`Error fetching auction slots: ${fetchError.message}`);
    }

    console.info(`Processing ${auctionSlots.length} active auction slots`);
    
    const now = new Date();
    const updates = [];
    
    // Process each auction slot
    for (const slot of auctionSlots) {
      let newState = null;
      const startTime = slot.start_time ? new Date(slot.start_time) : null;
      const endTime = slot.end_time ? new Date(slot.end_time) : null;
      
      if (!startTime || !endTime) {
        newState = AUCTION_STATES.PENDING;
      } else if (now < startTime) {
        newState = AUCTION_STATES.SCHEDULED;
      } else if (now >= startTime && now <= endTime) {
        newState = AUCTION_STATES.ACTIVE;
      } else if (now > endTime) {
        // Auction has ended
        newState = AUCTION_STATES.ENDED;
        
        // If it has a buyer, mark as completed
        if (slot.buyer_id) {
          newState = AUCTION_STATES.COMPLETED;
        }
      }
      
      // Only update if the state has changed
      if (newState && newState !== slot.auction_state) {
        updates.push({
          id: slot.id,
          auction_state: newState,
          // If the auction has ended, also mark it as inactive
          ...(newState === AUCTION_STATES.ENDED || newState === AUCTION_STATES.COMPLETED
            ? { is_active: false }
            : {})
        });
      }
    }
    
    console.info(`Found ${updates.length} slots requiring state updates`);
    
    // Batch update the slots that need state changes
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('auction_slots')
        .upsert(updates);
      
      if (updateError) {
        throw new Error(`Error updating auction states: ${updateError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: auctionSlots.length,
        updated: updates.length 
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Connection": "keep-alive"
        } 
      }
    );
  } catch (error) {
    console.error("Error in auction state update function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}); 