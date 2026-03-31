import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, Gauge, IndianRupee } from "lucide-react";

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  description: string | null;
  mileage_at_service: number | null;
  cost: number | null;
}

interface ServiceHistoryViewerProps {
  carId: string;
}

const ServiceHistoryViewer = ({ carId }: ServiceHistoryViewerProps) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("service_history")
          .select("id, service_date, service_type, description, mileage_at_service, cost")
          .eq("car_id", carId)
          .order("service_date", { ascending: false });
        if (error) throw error;
        setRecords(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [carId]);

  if (loading) return null;
  if (records.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          Service History ({records.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map(r => (
            <div key={r.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary">{r.service_type}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.service_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.description && <p className="text-sm text-muted-foreground mb-1">{r.description}</p>}
                <div className="flex gap-4 text-sm">
                  {r.mileage_at_service && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Gauge className="w-3 h-3" />{r.mileage_at_service.toLocaleString()} km
                    </span>
                  )}
                  {r.cost && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <IndianRupee className="w-3 h-3" />₹{r.cost.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceHistoryViewer;
