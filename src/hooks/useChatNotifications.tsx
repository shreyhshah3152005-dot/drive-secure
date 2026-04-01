import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerRole } from "@/hooks/useDealerRole";
import { toast } from "sonner";

interface ChatNotification {
  conversationId: string;
  senderType: string;
  content: string;
  timestamp: string;
}

export function useChatNotifications() {
  const { user } = useAuth();
  const { dealerInfo } = useDealerRole();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      // Customer unread
      const { data: customerConvs } = await supabase
        .from("chat_conversations")
        .select("customer_unread_count")
        .eq("customer_id", user.id);

      let total = (customerConvs || []).reduce((s, c) => s + c.customer_unread_count, 0);

      // Dealer unread
      if (dealerInfo?.id) {
        const { data: dealerConvs } = await supabase
          .from("chat_conversations")
          .select("dealer_unread_count")
          .eq("dealer_id", dealerInfo.id);

        total += (dealerConvs || []).reduce((s, c) => s + c.dealer_unread_count, 0);
      }

      setUnreadCount(total);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  }, [user, dealerInfo?.id]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    // Listen for new messages in real-time
    const channel = supabase
      .channel("chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const msg = payload.new as {
            sender_id: string;
            sender_type: string;
            content: string;
            conversation_id: string;
            created_at: string;
          };

          // Only notify if the message is NOT from the current user
          if (msg.sender_id !== user.id) {
            const preview = msg.content.length > 50 ? msg.content.slice(0, 50) + "..." : msg.content;
            toast.info(`New message: ${preview}`, {
              action: {
                label: "View",
                onClick: () => {
                  // Navigate to messages — dealer or dashboard
                  if (msg.sender_type === "customer" && dealerInfo?.id) {
                    window.location.href = "/dealer-panel";
                  } else {
                    window.location.href = "/dashboard";
                  }
                },
              },
            });

            setNotifications(prev => [{
              conversationId: msg.conversation_id,
              senderType: msg.sender_type,
              content: msg.content,
              timestamp: msg.created_at,
            }, ...prev].slice(0, 20));

            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dealerInfo?.id, fetchUnreadCount]);

  return { unreadCount, notifications, refreshCount: fetchUnreadCount };
}
