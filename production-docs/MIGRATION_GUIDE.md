# SokoClick Migration Guide

This document provides step-by-step instructions for implementing critical updates to the SokoClick application.

## 1. Fix Netlify SPA Routing

The 404 errors on the production site are caused by SPA routing issues. While the configuration files are already in place, ensure they are properly included in the build output:

1. **Verify _redirects File**: Ensure the file `public/_redirects` exists with content:
   ```
   /* /index.html 200
   ```

2. **Verify netlify.toml Configuration**: Confirm the `netlify.toml` file includes proper redirects:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Build and Validate**: Run the provided scripts to build and validate the site:
   ```powershell
   # In PowerShell (not Command Prompt)
   cd frontend
   ./deploy.ps1
   ./analyze-build.ps1
   ```

4. **Deploy**: Once validation passes, deploy to Netlify.

5. **Verification**: After deployment, visit `/deploy-check.html` on your site to verify routing works correctly.

## 2. Implement WhatsApp Database Schema

The WhatsApp integration UI has been implemented but requires database tables to store conversations and messages:

1. **Connect to Supabase**: Access your Supabase project's SQL editor.

2. **Execute Schema Migration**: Run the SQL in `production-docs/whatsapp-schema.sql`.

3. **Verify Tables**: Confirm the following tables were created:
   - `whatsapp_conversations`
   - `whatsapp_messages`

4. **Test RLS Policies**: Verify the Row Level Security policies are working correctly using the Supabase dashboard.

5. **Update API Models**: Verify the TypeScript models match the database schema.

## 3. PowerShell Command Execution

When using PowerShell on Windows, use separate commands instead of the `&&` operator:

```powershell
# INCORRECT in PowerShell:
cd frontend && pnpm run dev

# CORRECT in PowerShell:
cd frontend
pnpm run dev
```

## 4. Additional Recommendations

1. **Real-time Messaging**: Implement Supabase real-time subscriptions in the WhatsApp context for instant message updates:
   ```typescript
   useEffect(() => {
     const subscription = supabase
       .from('whatsapp_messages')
       .on('INSERT', (payload) => {
         // Handle new message
         if (payload.new.conversation_id === conversationId) {
           setMessages(prev => [...prev, payload.new]);
         }
       })
       .subscribe();
       
     return () => {
       subscription.unsubscribe();
     };
   }, [conversationId]);
   ```

2. **Admin Dashboard**: Complete the admin dashboard with management capabilities for WhatsApp conversations and messages.

3. **File Upload**: Implement file upload functionality for attachments in WhatsApp messages using Supabase Storage.

## 5. Troubleshooting

### 404 Errors
If you still see 404 errors after deployment:
1. Check Netlify build logs to ensure `_redirects` file is included
2. Verify your Netlify site settings under "Build & deploy" → "Continuous Deployment"
3. Test with a direct build upload using Netlify CLI

### Database Issues
If WhatsApp functionality isn't working after schema migration:
1. Verify your application is correctly connected to Supabase
2. Check browser console for API errors
3. Use Supabase dashboard to inspect actual data in the tables

## 6. Schema Diagram

```
┌───────────────────────┐      ┌────────────────────┐
│ whatsapp_conversations│      │ whatsapp_messages  │
├───────────────────────┤      ├────────────────────┤
│ id (PK)               │      │ id (PK)            │
│ product_id (FK)       │      │ conversation_id(FK)│
│ buyer_id (FK)         │◄─────┤ sender             │
│ seller_id (FK)        │      │ content            │
│ thread_id             │      │ type               │
│ product_name          │      │ attachments        │
│ product_image         │      │ is_read            │
│ status                │      │ metadata           │
│ last_message          │      │ timestamp          │
│ last_message_timestamp│      └────────────────────┘
│ unread_count          │
│ created_at            │
│ updated_at            │
└───────────────────────┘