import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface ChatWithDealerProps {
  dealerId: string;
  carId: string;
  carName: string;
  dealerName: string;
}

const ChatWithDealer = ({ dealerId, carId, carName, dealerName }: ChatWithDealerProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim()) {
      if (!user) toast.error("Please sign in to message the dealer");
      return;
    }

    setSending(true);
    try {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("dealer_id", dealerId)
        .eq("car_id", carId)
        .maybeSingle();

      let conversationId = existing?.id;

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("chat_conversations")
          .insert({
            customer_id: user.id,
            dealer_id: dealerId,
            car_id: carId,
          })
          .select("id")
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: "customer",
        content: `[About: ${carName}]\n\n${message.trim()}`,
      });

      if (msgError) throw msgError;

      // Send email notification to dealer
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();

        await supabase.functions.invoke("send-chat-notification", {
          body: {
            dealerId,
            messagePreview: message.trim().slice(0, 200),
            customerName: profile?.name || user.email || "A customer",
            carName,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      toast.success("Message sent to dealer!");
      setMessage("");
      setSent(true);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-5 h-5 text-primary" />
          Message {dealerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sent ? (
          <div className="text-center py-4">
            <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">Message Sent!</p>
            <p className="text-sm text-muted-foreground">The dealer will respond in the chat section.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setSent(false)}>
              Send Another Message
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ask about {carName} — availability, condition, pricing, or anything else.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in this car..."
              rows={3}
            />
            <Button onClick={handleSend} disabled={sending || !message.trim()} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatWithDealer;
