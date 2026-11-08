-- Migration: Pass đồ — Conversations & Messages
-- Batch 3: API-066 (DS khách quan tâm), API-067 (đọc chat), API-068 (gửi chat)

CREATE TABLE IF NOT EXISTS marketplace_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at  TIMESTAMPTZ DEFAULT NOW(),
  last_message_text TEXT,
  seller_unread    INTEGER NOT NULL DEFAULT 0,
  buyer_unread     INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_conv_listing ON marketplace_conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conv_buyer   ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conv_seller  ON marketplace_conversations(seller_id);

CREATE TABLE IF NOT EXISTS marketplace_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  is_offer        BOOLEAN NOT NULL DEFAULT false,
  offer_amount    NUMERIC(12,0),
  is_deal_confirm BOOLEAN NOT NULL DEFAULT false,
  is_deal_cancel  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conv ON marketplace_messages(conversation_id, created_at);

-- RLS
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer or seller can view conversation"
  ON marketplace_conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "buyer or seller can create conversation"
  ON marketplace_conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "buyer or seller can update conversation"
  ON marketplace_conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "buyer or seller can view messages"
  ON marketplace_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM marketplace_conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "buyer or seller can send messages"
  ON marketplace_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM marketplace_conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );
