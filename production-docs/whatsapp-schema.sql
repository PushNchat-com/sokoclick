-- WhatsApp schema for SokoClick
-- This script adds tables and policies for WhatsApp integration

-- WhatsApp conversations table
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  thread_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  status TEXT CHECK (status IN ('initiated', 'active', 'pending', 'completed', 'cancelled')),
  last_message TEXT,
  last_message_timestamp TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp messages table
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('buyer', 'seller', 'system')),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  attachments TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies for WhatsApp conversations

-- Only participants can view their conversations
CREATE POLICY "Users can view their own conversations" ON whatsapp_conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only participants can update their conversations
CREATE POLICY "Users can update their own conversations" ON whatsapp_conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only buyers can create conversations
CREATE POLICY "Buyers can create conversations" ON whatsapp_conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Policies for WhatsApp messages

-- Only participants can view messages in their conversations
CREATE POLICY "Users can view messages of their conversations" ON whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations 
      WHERE id = whatsapp_messages.conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Users can create messages for their conversations
CREATE POLICY "Users can send messages to their conversations" ON whatsapp_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations 
      WHERE id = conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Users can update (mark as read) messages in their conversations
CREATE POLICY "Users can update messages in their conversations" ON whatsapp_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations 
      WHERE id = whatsapp_messages.conversation_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Create a trigger to update conversation last_message and timestamp
CREATE OR REPLACE FUNCTION update_conversation_after_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET 
    last_message = NEW.content,
    last_message_timestamp = NEW.timestamp,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute the function on message insert
CREATE TRIGGER after_message_insert
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_after_message();

-- Create a function to update unread count
CREATE OR REPLACE FUNCTION update_unread_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET unread_count = (
    SELECT COUNT(*) FROM whatsapp_messages
    WHERE conversation_id = NEW.conversation_id
    AND is_read = FALSE
    AND sender <> (
      CASE 
        WHEN auth.uid() = (SELECT buyer_id FROM whatsapp_conversations WHERE id = NEW.conversation_id) THEN 'buyer'
        WHEN auth.uid() = (SELECT seller_id FROM whatsapp_conversations WHERE id = NEW.conversation_id) THEN 'seller'
        ELSE 'unknown'
      END
    )
  )
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute the unread count function
CREATE TRIGGER after_message_read_status_change
  AFTER UPDATE OF is_read ON whatsapp_messages
  FOR EACH ROW
  WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION update_unread_count();

-- Create a trigger to increment unread count on new message
CREATE TRIGGER after_new_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count(); 