import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface DealerResponseTimeProps {
  dealerId: string;
}

const DealerResponseTime = ({ dealerId }: DealerResponseTimeProps) => {
  const [avgMinutes, setAvgMinutes] = useState<number | null>(null);

  useEffect(() => {
    const calculate = async () => {
      try {
        // Get conversations for this dealer
        const { data: conversations } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("dealer_id", dealerId);

        if (!conversations || conversations.length === 0) return;

        const convIds = conversations.map((c) => c.id);
        
        // Get all messages in these conversations
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("conversation_id, sender_type, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: true });

        if (!messages || messages.length === 0) return;

        // Calculate response times
        const responseTimes: number[] = [];
        const grouped: Record<string, typeof messages> = {};
        messages.forEach((m) => {
          if (!grouped[m.conversation_id]) grouped[m.conversation_id] = [];
          grouped[m.conversation_id].push(m);
        });

        Object.values(grouped).forEach((msgs) => {
          for (let i = 1; i < msgs.length; i++) {
            if (msgs[i].sender_type === "dealer" && msgs[i - 1].sender_type === "customer") {
              const diff = new Date(msgs[i].created_at).getTime() - new Date(msgs[i - 1].created_at).getTime();
              responseTimes.push(diff / 60000); // minutes
            }
          }
        });

        if (responseTimes.length > 0) {
          setAvgMinutes(Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length));
        }
      } catch (e) {
        console.error(e);
      }
    };
    calculate();
  }, [dealerId]);

  if (avgMinutes === null) return null;

  const label = avgMinutes < 60
    ? `~${avgMinutes} min`
    : avgMinutes < 1440
      ? `~${Math.round(avgMinutes / 60)} hr`
      : `~${Math.round(avgMinutes / 1440)} day`;

  const color = avgMinutes < 30
    ? "bg-green-500/10 text-green-500 border-green-500/30"
    : avgMinutes < 120
      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      : "bg-red-500/10 text-red-500 border-red-500/30";

  return (
    <Badge variant="outline" className={`gap-1 ${color}`}>
      <Clock className="w-3 h-3" />
      Responds in {label}
    </Badge>
  );
};

export default DealerResponseTime;
