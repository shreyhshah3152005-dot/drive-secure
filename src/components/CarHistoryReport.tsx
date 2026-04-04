import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FileText, User, AlertTriangle, Wrench, Calendar, CheckCircle, Search, Shield, Loader2, Car } from "lucide-react";
import { toast } from "sonner";

interface CarHistoryReportProps {
  carId: string;
  carName: string;
}

interface VinReport {
  vin: string;
  make: string;
  model: string;
  modelYear: number;
  manufacturer: string;
  manufacturerCountry: string;
  vehicleType: string;
  bodyClass: string;
  driveType: string;
  fuelType: string;
  engineCylinders: string;
  engineDisplacement: string;
  transmission: string;
  doors: string;
  owners: { ownerNumber: number; duration: string; location: string; type: string }[];
  accidents: { date: string; severity: string; description: string; repaired: boolean; estimatedCost: number }[];
  recalls: { nhtsaCampaignNumber: string; component: string; summary: string; consequence: string; remedy: string; reportDate: string }[];
  titleStatus: string;
  floodDamage: boolean;
  theftRecord: boolean;
  odometerTampering: boolean;
  recallCount: number;
  lastInspectionDate: string;
  registrationStatus: string;
  insuranceClaims: number;
}

const CarHistoryReport = ({ carId, carName }: CarHistoryReportProps) => {
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vin, setVin] = useState("");
  const [vinReport, setVinReport] = useState<VinReport | null>(null);
  const [vinLoading, setVinLoading] = useState(false);

  useEffect(() => {
    const fetchServiceHistory = async () => {
      try {
        const { data } = await supabase
          .from("service_history")
          .select("*")
          .eq("car_id", carId)
          .order("service_date", { ascending: false });
        setServiceRecords(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceHistory();
  }, [carId]);

  const handleVinLookup = async () => {
    if (vin.length !== 17) {
      toast.error("VIN must be exactly 17 characters");
      return;
    }
    setVinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vin-lookup", {
        body: { vin: vin.toUpperCase() },
      });
      if (error) throw error;
      setVinReport(data);
      toast.success("VIN report fetched successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch VIN report");
    } finally {
      setVinLoading(false);
    }
  };

  if (loading) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Minor": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "Moderate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "Major": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "";
    }
  };

  const displayOwners = vinReport?.owners || [
    { ownerNumber: 1, duration: "2019 - 2022", location: "Mumbai, Maharashtra", type: "First Owner" },
    { ownerNumber: 2, duration: "2022 - Present", location: "Delhi, NCR", type: "2nd Owner" },
  ];

  const displayAccidents = vinReport?.accidents || [
    { date: "2021-06-15", severity: "Minor", description: "Minor scratch on rear bumper", repaired: true, estimatedCost: 5000 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Car History Report
        </CardTitle>
        <p className="text-sm text-muted-foreground">Complete history for {carName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* VIN Lookup */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-primary" />
            VIN Number Lookup
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 17-character VIN (e.g., MALA851CLHM123456)"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, ""))}
              maxLength={17}
              className="font-mono text-sm"
            />
            <Button onClick={handleVinLookup} disabled={vinLoading || vin.length !== 17} variant="hero" className="shrink-0">
              {vinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {vin.length}/17 characters {vinReport && "• ✅ Report loaded"}
          </p>
        </div>

        {/* VIN Report Summary */}
        {vinReport && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <Car className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Model Year</p>
                <p className="font-bold text-sm">{vinReport.modelYear}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <Shield className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Title Status</p>
                <p className="font-bold text-sm text-green-500">{vinReport.titleStatus}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${vinReport.accidents.length > 0 ? "text-yellow-500" : "text-green-500"}`} />
                <p className="text-xs text-muted-foreground">Accidents</p>
                <p className="font-bold text-sm">{vinReport.accidents.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <User className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Owners</p>
                <p className="font-bold text-sm">{vinReport.owners.length}</p>
              </div>
            </div>

            {/* Safety checks */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={vinReport.floodDamage ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"}>
                {vinReport.floodDamage ? "⚠️ Flood Damage" : "✅ No Flood Damage"}
              </Badge>
              <Badge variant="outline" className={vinReport.theftRecord ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"}>
                {vinReport.theftRecord ? "⚠️ Theft Record" : "✅ No Theft Record"}
              </Badge>
              <Badge variant="outline" className={vinReport.odometerTampering ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"}>
                {vinReport.odometerTampering ? "⚠️ Odometer Tampered" : "✅ Odometer OK"}
              </Badge>
            </div>
          </>
        )}

        <Separator />

        {/* Ownership History */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            Ownership History
          </h3>
          <div className="space-y-3">
            {displayOwners.map((owner) => (
              <div key={owner.ownerNumber} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {owner.ownerNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{owner.type || `Owner #${owner.ownerNumber}`}</p>
                  <p className="text-xs text-muted-foreground">{owner.duration} • {owner.location}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">
            {displayOwners.length} owner(s) on record
          </p>
        </div>

        <Separator />

        {/* Accident Records */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Accident Records
          </h3>
          {displayAccidents.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-500">No accidents reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayAccidents.map((record, i) => (
                <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{record.description}</p>
                    <Badge variant="outline" className={getSeverityColor(record.severity)}>
                      {record.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.date).toLocaleDateString("en-IN")}
                    </span>
                    {record.repaired && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-3 h-3" /> Repaired
                      </span>
                    )}
                    {record.estimatedCost && (
                      <span>₹{record.estimatedCost.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Service Timeline */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-primary" />
            Service Timeline
          </h3>
          {serviceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service records available</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {serviceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex gap-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium">{record.service_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.service_date).toLocaleDateString("en-IN")}
                        {record.mileage_at_service && ` • ${record.mileage_at_service.toLocaleString()} km`}
                        {record.cost && ` • ₹${record.cost.toLocaleString("en-IN")}`}
                      </p>
                      {record.description && (
                        <p className="text-xs text-muted-foreground mt-1">{record.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CarHistoryReport;
