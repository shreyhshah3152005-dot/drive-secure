import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_id: string;
  dealer_id: string;
  car_id: string | null;
  last_message_at: string;
  customer_unread_count: number;
  dealer_unread_count: number;
  dealer?: {
    dealership_name: string;
    profile_image_url: string | null;
  };
  customer?: {
    name: string;
    email: string;
  };
  car?: {
    name: string;
    brand: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "customer" | "dealer";
  content: string;
  is_read: boolean;
  created_at: string;
}

interface LiveChatProps {
  dealerId?: string;
  carId?: string;
  dealerName?: string;
  isDealer?: boolean;
}

const LiveChat = ({ dealerId, carId, dealerName, isDealer = false }: LiveChatProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation.id);
    markMessagesAsRead(activeConversation.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead(activeConversation.id);
          }
        }
      )
      .subscribe();

    // Subscribe to typing status
    const typingChannel = supabase
      .channel(`typing:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing_status",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const status = payload.new as { user_id: string; is_typing: boolean };
            if (status.user_id !== user?.id) {
              setTypingUsers((prev) => {
                const next = new Set(prev);
                if (status.is_typing) {
                  next.add(status.user_id);
                } else {
                  next.delete(status.user_id);
                }
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [activeConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          dealer:dealers(dealership_name, profile_image_url),
          car:dealer_cars(name, brand)
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Fetch customer profiles for each conversation
      const conversationsWithCustomers = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("user_id", conv.customer_id)
            .single();
          return { ...conv, customer: profile };
        })
      );

      setConversations(conversationsWithCustomers);

      // If we have a specific dealer and no active conversation, create/find one
      if (dealerId && !isDealer) {
        const existingConv = conversationsWithCustomers.find(
          (c) => c.dealer_id === dealerId && (carId ? c.car_id === carId : true)
        );
        if (existingConv) {
          setActiveConversation(existingConv);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      // Update messages
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);

      // Reset unread count
      const updateField = isDealer ? "dealer_unread_count" : "customer_unread_count";
      await supabase
        .from("chat_conversations")
        .update({ [updateField]: 0 })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const startNewConversation = async () => {
    if (!user || !dealerId) return;

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          customer_id: user.id,
          dealer_id: dealerId,
          car_id: carId || null,
        })
        .select(`
          *,
          dealer:dealers(dealership_name, profile_image_url),
          car:dealer_cars(name, brand)
        `)
        .single();

      if (error) throw error;
      
      setActiveConversation(data);
      setConversations((prev) => [data, ...prev]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        sender_type: isDealer ? "dealer" : "customer",
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      updateTypingStatus(false);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !activeConversation) return;

    try {
      await supabase.from("chat_typing_status").upsert(
        {
          conversation_id: activeConversation.id,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id,user_id" }
      );
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value) {
      updateTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 2000);
    } else {
      updateTypingStatus(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => {
      return sum + (isDealer ? conv.dealer_unread_count : conv.customer_unread_count);
    }, 0);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {getTotalUnread() > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                variant="destructive"
              >
                {getTotalUnread()}
              </Badge>
            )}
          </>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[380px] h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {activeConversation
                ? isDealer
                  ? activeConversation.customer?.name || "Customer"
                  : activeConversation.dealer?.dealership_name || "Dealer"
                : "Messages"}
            </CardTitle>
            {activeConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveConversation(null)}
              >
                Back
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !activeConversation ? (
              /* Conversation List */
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {/* Start new conversation button for customers */}
                  {dealerId && !isDealer && conversations.length === 0 && (
                    <Button
                      onClick={startNewConversation}
                      className="w-full mb-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat with {dealerName || "Dealer"}
                    </Button>
                  )}

                  {conversations.length === 0 && !dealerId && (
                    <p className="text-center text-muted-foreground py-8">
                      No conversations yet
                    </p>
                  )}

                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className="w-full p-3 rounded-lg hover:bg-muted text-left flex items-center gap-3 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            isDealer
                              ? undefined
                              : conv.dealer?.profile_image_url || undefined
                          }
                        />
                        <AvatarFallback>
                          {isDealer
                            ? conv.customer?.name?.charAt(0) || "C"
                            : conv.dealer?.dealership_name?.charAt(0) || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {isDealer
                              ? conv.customer?.name || "Customer"
                              : conv.dealer?.dealership_name || "Dealer"}
                          </p>
                          {(isDealer ? conv.dealer_unread_count : conv.customer_unread_count) > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {isDealer ? conv.dealer_unread_count : conv.customer_unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.car && (
                          <p className="text-xs text-muted-foreground truncate">
                            About: {conv.car.brand} {conv.car.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </button>
                  ))}

                  {dealerId && !isDealer && conversations.length > 0 && (
                    <Button
                      onClick={startNewConversation}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  )}
                </div>
              </ScrollArea>
            ) : (
              /* Messages View */
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isOwn
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default LiveChat;
