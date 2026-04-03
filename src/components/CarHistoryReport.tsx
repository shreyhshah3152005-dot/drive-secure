import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, User, AlertTriangle, Wrench, Calendar, CheckCircle } from "lucide-react";

interface CarHistoryReportProps {
  carId: string;
  carName: string;
}

interface OwnerRecord {
  ownerNumber: number;
  duration: string;
  location: string;
}

interface AccidentRecord {
  date: string;
  severity: "Minor" | "Moderate" | "Major";
  description: string;
  repaired: boolean;
}

const CarHistoryReport = ({ carId, carName }: CarHistoryReportProps) => {
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated ownership & accident data (in production, these would come from a VIN lookup API)
  const ownershipHistory: OwnerRecord[] = [
    { ownerNumber: 1, duration: "2019 - 2022", location: "Mumbai, Maharashtra" },
    { ownerNumber: 2, duration: "2022 - Present", location: "Delhi, NCR" },
  ];

  const accidentRecords: AccidentRecord[] = [
    { date: "2021-06-15", severity: "Minor", description: "Minor scratch on rear bumper", repaired: true },
  ];

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

  if (loading) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Minor": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "Moderate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "Major": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "";
    }
  };

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
        {/* Ownership History */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            Ownership History
          </h3>
          <div className="space-y-3">
            {ownershipHistory.map((owner) => (
              <div key={owner.ownerNumber} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {owner.ownerNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Owner #{owner.ownerNumber}</p>
                  <p className="text-xs text-muted-foreground">{owner.duration} • {owner.location}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">
            {ownershipHistory.length} owner(s) on record
          </p>
        </div>

        <Separator />

        {/* Accident Records */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Accident Records
          </h3>
          {accidentRecords.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-500">No accidents reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accidentRecords.map((record, i) => (
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
                {serviceRecords.slice(0, 10).map((record, i) => (
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
