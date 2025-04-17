# SokoClick MCP Example Queries

This document provides specific example queries you can use with the Model Context Protocol (MCP) integration to interact with your Supabase database for the SokoClick project.

## Auction Slot Queries

### View All Active Auction Slots

```
Show me all currently active auction slots and their associated products.
```

This will generate and execute a SQL query similar to:

```sql
SELECT 
  as.id as slot_id, 
  as.is_active, 
  as.featured,
  as.start_time,
  as.end_time, 
  p.id as product_id, 
  p.name_en, 
  p.starting_price, 
  p.currency
FROM 
  auction_slots as 
JOIN 
  products p ON as.product_id = p.id 
WHERE 
  as.is_active = true 
ORDER BY 
  as.featured DESC, as.id ASC;
```

### Find Featured Auctions

```
List all featured auction slots with their view counts
```

### Get Auction Slots by Status

```
Show me auction slots that are scheduled to start in the next 24 hours
```

## Product Queries

### Product Performance Analysis

```
Which products have the highest view counts in active auctions?
```

### Category Analysis

```
Show me the distribution of products by category and their average starting prices
```

### Seller Inventory

```
List all products for seller with ID 'specific-seller-id'
```

## User Management

### Find Active Sellers

```
Who are the top 5 sellers based on number of active auction slots?
```

### User Activity

```
Show me users who have logged in during the last 7 days
```

## Database Schema Exploration

### Table Structure

```
Show me the structure of the auction_slots table
```

### Relationship Exploration

```
Explain the relationship between the users, products, and auction_slots tables
```

## Query Generation for Frontend Components

### Data for Homepage

```
Help me write a query to get the data needed for the AuctionGrid component on the homepage
```

### Seller Dashboard Data

```
Generate a query to fetch all the data needed for the SellerDashboard component
```

## Testing Helpers

### Generate Test Data

```
Help me create test data for the auction_slots table that includes a mix of active, featured, and ended auctions
```

### Query Optimization

```
Review and optimize this query for the product listing page:
SELECT * FROM products WHERE seller_id = 'seller-123' ORDER BY created_at DESC;
```

## Using MCP with Mock Data

When working with our mock data for testing, you can ask:

```
How would I modify this query to work with our mock data structure in useMockData.ts?
```

This can help translate between real database queries and our mock data structure for testing.

## Security Considerations

- Always review generated SQL before executing directly in your database
- Be cautious about exposing sensitive data in queries
- Remember that the token used for MCP has the same permissions as your account

## Next Steps

After running queries through MCP, you might want to:

1. Save useful queries in a SQL snippets file for future reference
2. Use the query results to inform frontend component design
3. Create functions in your codebase that implement the optimized queries
4. Add test cases based on the data insights discovered 