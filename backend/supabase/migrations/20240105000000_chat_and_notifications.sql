-- UniMove Database Schema - Chat & Notifications
-- Description: Real-time messaging and notification system

-- Create ENUM types
CREATE TYPE message_type AS ENUM (
    'text',
    'image',
    'location',
    'system',
    'order_update'
);

CREATE TYPE notification_type AS ENUM (
    'order_created',
    'order_accepted',
    'order_started',
    'order_completed',
    'order_cancelled',
    'payment_received',
    'payment_failed',
    'new_message',
    'provider_nearby',
    'promotion',
    'system_announcement'
);

CREATE TYPE notification_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

-- =====================================================
-- CHAT SYSTEM
-- =====================================================

-- Chat conversations (between customer and provider)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Last message info
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    -- Unread counts
    customer_unread_count INTEGER DEFAULT 0,
    provider_unread_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(order_id)
);

-- Chat messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Sender info
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_role user_role NOT NULL,
    
    -- Message content
    message_type message_type NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    
    -- Media attachments
    media_url TEXT,
    media_type TEXT, -- image/jpeg, image/png, etc.
    media_size INTEGER, -- in bytes
    thumbnail_url TEXT,
    
    -- Location data (for location messages)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_name TEXT,
    
    -- Message metadata
    metadata JSONB,
    
    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Delivery status
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    
    -- Reply/Thread
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message reactions (emoji reactions)
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL, -- emoji or reaction type
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction)
);

-- Typing indicators (real-time typing status)
CREATE TABLE typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(conversation_id, user_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key TEXT UNIQUE NOT NULL,
    notification_type notification_type NOT NULL,
    
    -- Template content
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    
    -- Localization
    language TEXT NOT NULL DEFAULT 'vi',
    
    -- Priority
    default_priority notification_priority DEFAULT 'normal',
    
    -- Channels
    send_push BOOLEAN DEFAULT TRUE,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority notification_priority DEFAULT 'normal',
    
    -- Associated entities
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Action/Deep link
    action_url TEXT,
    action_data JSONB,
    
    -- Image/Icon
    image_url TEXT,
    icon TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Delivery status
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    
    -- Push notification
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    push_token TEXT,
    push_response JSONB,
    
    -- Email notification
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    
    -- SMS notification
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push notification tokens (FCM tokens)
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Token info
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- ios, android, web
    device_id TEXT,
    device_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, token)
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Channel preferences
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Notification type preferences
    order_updates BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    chat_messages BOOLEAN DEFAULT TRUE,
    promotions BOOLEAN DEFAULT TRUE,
    system_announcements BOOLEAN DEFAULT TRUE,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    
    -- Targeting
    target_audience TEXT NOT NULL DEFAULT 'all', -- all, customers, providers
    target_cities TEXT[],
    
    -- Priority
    priority notification_priority DEFAULT 'normal',
    
    -- Action
    action_url TEXT,
    action_label TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Stats
    sent_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_order ON conversations(order_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_provider ON conversations(provider_id);
CREATE INDEX idx_conversations_active ON conversations(is_active);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_messages_type ON messages(message_type);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_user ON typing_indicators(user_id);

CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_type ON notification_templates(notification_type);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_order ON notifications(order_id);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

CREATE INDEX idx_announcements_published ON announcements(is_published);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_scheduled ON announcements(scheduled_at);

-- Apply updated_at triggers
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_typing_indicators_updated_at BEFORE UPDATE ON typing_indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        customer_unread_count = CASE 
            WHEN NEW.sender_role != 'customer' THEN customer_unread_count + 1
            ELSE customer_unread_count
        END,
        provider_unread_count = CASE 
            WHEN NEW.sender_role != 'provider' THEN provider_unread_count + 1
            ELSE provider_unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to reset unread count on message read
CREATE OR REPLACE FUNCTION reset_unread_on_read()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation conversations%ROWTYPE;
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        SELECT * INTO v_conversation FROM conversations WHERE id = NEW.conversation_id;
        
        UPDATE conversations
        SET 
            customer_unread_count = CASE 
                WHEN NEW.sender_role != 'customer' THEN GREATEST(customer_unread_count - 1, 0)
                ELSE customer_unread_count
            END,
            provider_unread_count = CASE 
                WHEN NEW.sender_role != 'provider' THEN GREATEST(provider_unread_count - 1, 0)
                ELSE provider_unread_count
            END
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_unread_trigger
    AFTER UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_unread_on_read();

-- Function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
    p_user_id UUID,
    p_template_key TEXT,
    p_variables JSONB,
    p_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_template notification_templates%ROWTYPE;
    v_title TEXT;
    v_body TEXT;
    v_notification_id UUID;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM notification_templates
    WHERE template_key = p_template_key AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', p_template_key;
    END IF;
    
    -- Replace variables in template (simple replacement)
    v_title := v_template.title_template;
    v_body := v_template.body_template;
    
    -- Insert notification
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        body,
        priority,
        order_id
    ) VALUES (
        p_user_id,
        v_template.notification_type,
        v_title,
        v_body,
        v_template.default_priority,
        p_order_id
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE conversations IS 'Chat conversations between customers and providers';
COMMENT ON TABLE messages IS 'Chat messages within conversations';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE typing_indicators IS 'Real-time typing status';
COMMENT ON TABLE notification_templates IS 'Templates for system notifications';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE push_tokens IS 'FCM push notification tokens';
COMMENT ON TABLE notification_preferences IS 'User notification preferences';
COMMENT ON TABLE announcements IS 'System-wide announcements';
