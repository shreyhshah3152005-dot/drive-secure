import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Scale, ChevronUp, ChevronDown } from "lucide-react";

interface Dealer {
  id: string;
  dealership_name: string;
  profile_image_url: string | null;
}

interface DealerCompareBarProps {
  dealers: Dealer[];
  onRemove: (dealerId: string) => void;
  onClear: () => void;
}

const DealerCompareBar = ({ dealers, onRemove, onClear }: DealerCompareBarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (dealers.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <span className="font-medium">Compare Dealers ({dealers.length}/4)</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear All
            </Button>
            <Link to={`/compare-dealers-detail?dealers=${dealers.map(d => d.id).join(",")}`}>
              <Button size="sm" disabled={dealers.length < 2}>
                Compare Now
              </Button>
            </Link>
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex gap-4 pb-4 overflow-x-auto">
            {dealers.map((dealer) => (
              <div
                key={dealer.id}
                className="relative flex items-center gap-2 bg-muted rounded-lg p-2 pr-8 min-w-[200px]"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {dealer.profile_image_url ? (
                    <img
                      src={dealer.profile_image_url}
                      alt={dealer.dealership_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {dealer.dealership_name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium truncate">{dealer.dealership_name}</span>
                <button
                  onClick={() => onRemove(dealer.id)}
                  className="absolute top-1 right-1 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 2 - dealers.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 min-w-[200px] h-14"
              >
                <span className="text-sm text-muted-foreground">Add dealer</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerCompareBar;
