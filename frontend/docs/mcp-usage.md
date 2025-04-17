# Using MCP with SokoClick

This document contains examples of how to use the Model Context Protocol (MCP) integration with Supabase for the SokoClick project.

## Querying Auction Data

You can ask your AI assistant queries like:

- "Show me all active auction slots"
- "Find products with the highest starting prices"
- "List all products in the electronics category"
- "How many auctions are currently featured?"

## Database Schema Assistance

Ask about the database structure:

- "Explain the relationship between auction slots and products"
- "What fields are available in the user profile table?"
- "Show me the schema for the auction_slots table"
- "What indexes do we have on the products table?"

## Query Generation

Generate optimized queries:

- "Write a query to find all products by a specific seller"
- "Create a query to show auctions ending in the next 24 hours"
- "Help me write a query to count products by category"
- "Generate a query to find the most viewed auctions"

## Frontend Integration

Get help with frontend-backend integration:

- "How should I structure the API call to fetch auction data in AuctionDetail.tsx?"
- "Suggest optimizations for the current data fetching in the Seller Dashboard"
- "What's the best way to manage state for auction data in the frontend?"
- "Help me implement real-time updates for auction prices"

## Example Workflow

Here's an example workflow using MCP:

1. **Query exploration**: "Show me all tables in the SokoClick database"
2. **Schema understanding**: "Describe the structure of the auction_slots table"
3. **Query generation**: "Generate a query to find all active auctions with bids"
4. **Frontend implementation**: "Help me implement this query in the Dashboard component"
5. **Testing**: "Generate test data to verify my auction query works correctly"

## Limitations

- MCP cannot modify your database directly (unless you explicitly ask it to generate code to do so)
- Complex joins or very large result sets may be challenging to process
- Always verify generated queries before running them in production
- Sensitive data should be handled with care

## Using with Mock Data

The MCP integration works well alongside our Supabase mock utilities:

- During development, you can use MCP to explore the real database structure
- For testing, you can continue using the mock utilities we've implemented
- You can ask the AI to help convert real database queries to work with our mock data structure 