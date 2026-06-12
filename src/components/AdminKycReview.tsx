import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type KycRow = {
  id: string;
  user_id: string;
  status: "pending" | "verified" | "rejected";
  account_type: string;
  full_name: string;
  document_type: string;
  document_number: string;
  document_url: string | null;
  selfie_url: string | null;
  admin_notes: string | null;
  created_at: string;
};

export default function AdminKycReview() {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KycRow | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kyc_verifications")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as KycRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const signUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  };

  const openReview = async (row: KycRow) => {
    setSelected(row);
    setNotes(row.admin_notes ?? "");
    setDocUrl(await signUrl(row.document_url));
    setSelfieUrl(await signUrl(row.selfie_url));
  };

  const decide = async (status: "verified" | "rejected") => {
    if (!selected) return;
    setActing(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("kyc_verifications")
      .update({
        status,
        admin_notes: notes || null,
        reviewed_by: u.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success(`KYC ${status}`);
    setSelected(null);
    fetchRows();
  };

  const badge = (s: KycRow["status"]) => {
    if (s === "verified") return <Badge className="bg-green-600"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    if (s === "rejected") return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><ShieldQuestion className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />KYC Verification Queue</CardTitle>
        <CardDescription>Review and approve identity submissions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No KYC submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 flex-wrap gap-3">
                <div>
                  <p className="font-medium">{r.full_name} {badge(r.status)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.account_type} • {r.document_type.toUpperCase()} ****{r.document_number.slice(-4)} • {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openReview(r)}>
                  <Eye className="w-4 h-4 mr-2" /> Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review KYC — {selected?.full_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-sm">
                <p><b>Account:</b> {selected.account_type}</p>
                <p><b>Document:</b> {selected.document_type.toUpperCase()} — {selected.document_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID Document</p>
                  {docUrl ? <a href={docUrl} target="_blank" rel="noreferrer"><img src={docUrl} alt="doc" className="rounded border w-full h-40 object-cover" /></a> : <p className="text-xs">None</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Selfie</p>
                  {selfieUrl ? <a href={selfieUrl} target="_blank" rel="noreferrer"><img src={selfieUrl} alt="selfie" className="rounded border w-full h-40 object-cover" /></a> : <p className="text-xs">None</p>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes (optional)</p>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" disabled={acting} onClick={() => decide("rejected")}>Reject</Button>
            <Button disabled={acting} onClick={() => decide("verified")}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
