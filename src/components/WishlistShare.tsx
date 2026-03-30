import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  carIds: string[];
}

const WishlistShare = ({ carIds }: Props) => {
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    if (!user || carIds.length === 0) {
      toast.error("No cars in wishlist to share");
      return;
    }

    setIsGenerating(true);
    try {
      // Check if share already exists
      const { data: existing } = await supabase
        .from("wishlist_shares")
        .select("share_code")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Update existing share
        await supabase
          .from("wishlist_shares")
          .update({ car_ids: carIds })
          .eq("user_id", user.id);

        const url = `${window.location.origin}/shared-wishlist/${existing.share_code}`;
        setShareUrl(url);
      } else {
        // Create new share
        const { data, error } = await supabase
          .from("wishlist_shares")
          .insert({ user_id: user.id, car_ids: carIds })
          .select("share_code")
          .single();

        if (error) throw error;
        const url = `${window.location.origin}/shared-wishlist/${data.share_code}`;
        setShareUrl(url);
      }
      toast.success("Share link generated!");
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {!shareUrl ? (
        <Button variant="outline" size="sm" className="gap-2" onClick={generateShareLink} disabled={isGenerating || carIds.length === 0}>
          <Share2 className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Share Wishlist"}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="text-xs bg-secondary/50 border border-border rounded px-2 py-1 w-48 truncate"
          />
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WishlistShare;
