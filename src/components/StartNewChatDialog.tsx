import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageCircle, Search, Building2, MapPin } from "lucide-react";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  profile_image_url: string | null;
  verification_status: string;
}

interface StartNewChatDialogProps {
  onChatStarted?: (conversationId: string, dealerId: string) => void;
}

const StartNewChatDialog = ({ onChatStarted }: StartNewChatDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchDealers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = dealers.filter(
        (d) =>
          d.dealership_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDealers(filtered);
    } else {
      setFilteredDealers(dealers);
    }
  }, [searchQuery, dealers]);

  const fetchDealers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("id, dealership_name, city, profile_image_url, verification_status")
        .eq("is_active", true)
        .order("dealership_name");

      if (error) throw error;
      setDealers(data || []);
      setFilteredDealers(data || []);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to load dealers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (dealerId: string) => {
    if (!user) return;

    setIsStartingChat(dealerId);
    try {
      // Check if conversation already exists
      const { data: existing, error: checkError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("dealer_id", dealerId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast.info("Chat already exists with this dealer");
        onChatStarted?.(existing.id, dealerId);
        setOpen(false);
        return;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("chat_conversations")
        .insert({
          customer_id: user.id,
          dealer_id: dealerId,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      toast.success("Chat started!");
      onChatStarted?.(newConv.id, dealerId);
      setOpen(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setIsStartingChat(null);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <MessageCircle className="h-4 w-4" />
          Start New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start a New Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dealers by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Dealer List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No dealers found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDealers.map((dealer) => (
                  <button
                    key={dealer.id}
                    onClick={() => handleStartChat(dealer.id)}
                    disabled={isStartingChat === dealer.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={dealer.profile_image_url || undefined} />
                      <AvatarFallback>
                        {dealer.dealership_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{dealer.dealership_name}</p>
                        {dealer.verification_status === "verified" && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dealer.city}
                      </p>
                    </div>
                    {isStartingChat === dealer.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartNewChatDialog;
