import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerRole } from "@/hooks/useDealerRole";
import { MessageCircle, Send, Loader2, User } from "lucide-react";
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

const DealerLiveChat = () => {
  const { user } = useAuth();
  const { dealerInfo } = useDealerRole();
  const dealerId = dealerInfo?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (dealerId) {
      fetchConversations();

      // Subscribe to new conversations
      const conversationsChannel = supabase
        .channel("dealer-conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_conversations",
            filter: `dealer_id=eq.${dealerId}`,
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [dealerId]);

  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation.id);
    markMessagesAsRead(activeConversation.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`dealer-messages:${activeConversation.id}`)
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
      .channel(`dealer-typing:${activeConversation.id}`)
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
    if (!dealerId) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          car:dealer_cars(name, brand)
        `)
        .eq("dealer_id", dealerId)
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
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);

      await supabase
        .from("chat_conversations")
        .update({ dealer_unread_count: 0 })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        sender_type: "dealer",
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
    return conversations.reduce((sum, conv) => sum + conv.dealer_unread_count, 0);
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
            {getTotalUnread() > 0 && (
              <Badge variant="destructive">{getTotalUnread()}</Badge>
            )}
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 px-4">
                No conversations yet. Customers will appear here when they message you.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors",
                    activeConversation?.id === conv.id
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {conv.customer?.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {conv.customer?.name || "Customer"}
                      </p>
                      {conv.dealer_unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.dealer_unread_count}
                        </Badge>
                      )}
                    </div>
                    {conv.car && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.car.brand} {conv.car.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <User className="h-12 w-12 mb-4" />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {activeConversation.customer?.name?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p>{activeConversation.customer?.name || "Customer"}</p>
                  {activeConversation.car && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {activeConversation.car.brand} {activeConversation.car.name}
                    </p>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_type === "dealer";
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
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
      </div>
    </Card>
  );
};

export default DealerLiveChat;
