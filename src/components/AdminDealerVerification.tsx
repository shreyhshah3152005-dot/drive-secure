import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Store, MapPin, CheckCircle2, Star, Crown, AlertCircle } from "lucide-react";
import DealerVerificationBadge, { type VerificationStatus } from "./DealerVerificationBadge";

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  phone: string | null;
  verification_status: string;
  is_active: boolean;
  subscription_plan: string;
}

const verificationLevels = [
  { value: "unverified", label: "Unverified", icon: AlertCircle, color: "text-muted-foreground" },
  { value: "verified", label: "Verified", icon: CheckCircle2, color: "text-blue-500" },
  { value: "trusted", label: "Trusted", icon: Star, color: "text-amber-500" },
  { value: "premium_partner", label: "Premium Partner", icon: Crown, color: "text-purple-500" },
];

const AdminDealerVerification = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDealers = async () => {
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("id, dealership_name, city, phone, verification_status, is_active, subscription_plan")
        .eq("is_active", true)
        .order("dealership_name");

      if (error) throw error;
      setDealers(data || []);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const updateVerificationStatus = async (dealer: Dealer, newStatus: string) => {
    if (dealer.verification_status === newStatus) return;

    setUpdatingId(dealer.id);
    try {
      const { error } = await supabase
        .from("dealers")
        .update({ verification_status: newStatus })
        .eq("id", dealer.id);

      if (error) throw error;

      toast.success(`${dealer.dealership_name}'s verification updated to ${newStatus.replace('_', ' ')}`);
      fetchDealers();
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update verification status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getVerificationInfo = (status: string) => {
    return verificationLevels.find(v => v.value === status) || verificationLevels[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Dealer Verification Management
        </CardTitle>
        <CardDescription>
          Manage verification badges for active dealers based on documentation and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dealers.length === 0 ? (
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active dealers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dealers.map((dealer) => {
              const currentLevel = getVerificationInfo(dealer.verification_status);
              const CurrentIcon = currentLevel.icon;
              
              return (
                <div
                  key={dealer.id}
                  className="p-5 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-foreground text-lg">
                          {dealer.dealership_name}
                        </h3>
                        <DealerVerificationBadge status={dealer.verification_status as VerificationStatus} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          {dealer.subscription_plan}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{dealer.city}</span>
                        {dealer.phone && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{dealer.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select
                        value={dealer.verification_status}
                        onValueChange={(value) => updateVerificationStatus(dealer, value)}
                        disabled={updatingId === dealer.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <CurrentIcon className={`w-4 h-4 ${currentLevel.color}`} />
                              <span>{currentLevel.label}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {verificationLevels.map((level) => {
                            const LevelIcon = level.icon;
                            return (
                              <SelectItem key={level.value} value={level.value}>
                                <div className="flex items-center gap-2">
                                  <LevelIcon className={`w-4 h-4 ${level.color}`} />
                                  <span>{level.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {updatingId === dealer.id && (
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Verification Levels</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {verificationLevels.map((level) => {
              const LevelIcon = level.icon;
              return (
                <div key={level.value} className="flex items-center gap-2 text-sm">
                  <LevelIcon className={`w-4 h-4 ${level.color}`} />
                  <span className="text-muted-foreground">{level.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDealerVerification;
