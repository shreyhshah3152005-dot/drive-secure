-- Create chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.dealer_cars(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  customer_unread_count INTEGER NOT NULL DEFAULT 0,
  dealer_unread_count INTEGER NOT NULL DEFAULT 0
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'dealer')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create typing indicators table (ephemeral, for real-time only)
CREATE TABLE public.chat_typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_typing_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Customers can view their own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Dealers can view their own conversations"
ON public.chat_conversations FOR SELECT
USING (dealer_id = get_dealer_id(auth.uid()));

CREATE POLICY "Customers can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update conversations"
ON public.chat_conversations FOR UPDATE
USING (auth.uid() = customer_id OR dealer_id = get_dealer_id(auth.uid()));

CREATE POLICY "Admins can view all conversations"
ON public.chat_conversations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chat_messages
CREATE POLICY "Customers can view messages in their conversations"
ON public.chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations 
  WHERE id = conversation_id AND customer_id = auth.uid()
));

CREATE POLICY "Dealers can view messages in their conversations"
ON public.chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations 
  WHERE id = conversation_id AND dealer_id = get_dealer_id(auth.uid())
));

CREATE POLICY "Customers can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_type = 'customer' AND 
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id AND customer_id = auth.uid()
  )
);

CREATE POLICY "Dealers can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_type = 'dealer' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE id = conversation_id AND dealer_id = get_dealer_id(auth.uid())
  )
);

CREATE POLICY "Participants can update message read status"
ON public.chat_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations 
  WHERE id = conversation_id AND (customer_id = auth.uid() OR dealer_id = get_dealer_id(auth.uid()))
));

CREATE POLICY "Admins can view all messages"
ON public.chat_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chat_typing_status
CREATE POLICY "Participants can view typing status"
ON public.chat_typing_status FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations 
  WHERE id = conversation_id AND (customer_id = auth.uid() OR dealer_id = get_dealer_id(auth.uid()))
));

CREATE POLICY "Users can manage their typing status"
ON public.chat_typing_status FOR ALL
USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_status;

-- Function to update unread counts
CREATE OR REPLACE FUNCTION public.update_chat_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type = 'customer' THEN
    UPDATE public.chat_conversations 
    SET dealer_unread_count = dealer_unread_count + 1, 
        last_message_at = now(),
        updated_at = now()
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.chat_conversations 
    SET customer_unread_count = customer_unread_count + 1, 
        last_message_at = now(),
        updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_chat_unread_count();