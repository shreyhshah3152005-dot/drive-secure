import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

interface AuditRow {
  id: string;
  booking_id: string;
  user_id: string;
  actor_id: string;
  action_type: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface BookingMeta {
  id: string;
  car_brand: string;
  car_model: string;
  car_registration: string;
}

interface ProfileMeta { user_id: string; name: string | null; email: string | null; }

const labelFor = (t: string) => {
  switch (t) {
    case "service_done": return { txt: "Service done", color: "bg-green-500/10 text-green-600 border-green-500/30" };
    case "service_undo": return { txt: "Service undone", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "wash_done": return { txt: "Wash done", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" };
    case "wash_undo": return { txt: "Wash undone", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "status_change": return { txt: "Status changed", color: "bg-primary/10 text-primary border-primary/30" };
    default: return { txt: t, color: "" };
  }
};

const ServiceAuditLog = ({ bookingId }: { bookingId?: string }) => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [bookings, setBookings] = useState<Record<string, BookingMeta>>({});
  const [actors, setActors] = useState<Record<string, ProfileMeta>>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("service_audit_log").select("*").order("created_at", { ascending: false }).limit(500);
    if (bookingId) q = q.eq("booking_id", bookingId);
    const { data } = await q;
    const list = (data as AuditRow[]) || [];
    setRows(list);
    const bIds = Array.from(new Set(list.map((r) => r.booking_id)));
    const aIds = Array.from(new Set(list.map((r) => r.actor_id)));
    if (bIds.length) {
      const { data: bs } = await supabase.from("service_bookings")
        .select("id, car_brand, car_model, car_registration").in("id", bIds);
      const m: Record<string, BookingMeta> = {};
      (bs as BookingMeta[] || []).forEach((b) => { m[b.id] = b; });
      setBookings(m);
    }
    if (aIds.length) {
      const { data: ps } = await supabase.from("profiles")
        .select("user_id, name, email").in("user_id", aIds);
      const m: Record<string, ProfileMeta> = {};
      (ps as ProfileMeta[] || []).forEach((p) => { m[p.user_id] = p; });
      setActors(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`audit-${bookingId || "all"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_audit_log" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.action_type !== filter) return false;
    if (search) {
      const b = bookings[r.booking_id];
      const a = actors[r.actor_id];
      const hay = `${b?.car_registration || ""} ${b?.car_brand || ""} ${b?.car_model || ""} ${a?.name || ""} ${a?.email || ""}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Activity Log</CardTitle>
        <p className="text-xs text-muted-foreground">Every wash/service done or undo, with who and when.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Search vehicle or actor..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="service_done">Service done</SelectItem>
              <SelectItem value="service_undo">Service undone</SelectItem>
              <SelectItem value="wash_done">Wash done</SelectItem>
              <SelectItem value="wash_undo">Wash undone</SelectItem>
              <SelectItem value="status_change">Status change</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {filtered.map((r) => {
              const lab = labelFor(r.action_type);
              const b = bookings[r.booking_id];
              const a = actors[r.actor_id];
              return (
                <div key={r.id} className="p-3 rounded-lg border border-border/40 flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className={lab.color}>{lab.txt}</Badge>
                  <span className="text-muted-foreground">
                    {r.previous_value} → <strong className="text-foreground">{r.new_value}</strong>
                  </span>
                  {b && <span className="text-xs text-muted-foreground">· {b.car_brand} {b.car_model} <span className="font-mono">({b.car_registration})</span></span>}
                  <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="w-3 h-3" />{a?.name || a?.email || "Provider"}
                    <span>· {format(new Date(r.created_at), "dd MMM yyyy HH:mm")}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceAuditLog;
