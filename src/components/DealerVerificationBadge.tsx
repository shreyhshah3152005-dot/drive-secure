import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Award, Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus = "unverified" | "verified" | "trusted" | "premium_partner";

interface DealerVerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
  showLabel?: boolean;
}

const verificationConfig: Record<
  VerificationStatus,
  {
    label: string;
    description: string;
    icon: typeof Shield;
    className: string;
  }
> = {
  unverified: {
    label: "Unverified",
    description: "This dealer has not been verified yet",
    icon: Shield,
    className: "bg-muted text-muted-foreground border-muted",
  },
  verified: {
    label: "Verified",
    description: "This dealer's identity and business documents have been verified",
    icon: ShieldCheck,
    className: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  },
  trusted: {
    label: "Trusted Seller",
    description: "This dealer has an excellent track record with consistent positive reviews",
    icon: Award,
    className: "bg-green-500/20 text-green-500 border-green-500/30",
  },
  premium_partner: {
    label: "Premium Partner",
    description: "Official premium partner with priority support and exclusive benefits",
    icon: Crown,
    className: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  },
};

const DealerVerificationBadge = ({
  status,
  className = "",
  showLabel = true,
}: DealerVerificationBadgeProps) => {
  const config = verificationConfig[status];
  const Icon = config.icon;

  if (status === "unverified" && !showLabel) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} ${className} cursor-help`}>
            <Icon className="w-3 h-3 mr-1" />
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DealerVerificationBadge;