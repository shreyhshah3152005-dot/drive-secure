import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

type KycRow = {
  id: string;
  status: "pending" | "verified" | "rejected";
  account_type: string;
  full_name: string;
  document_type: string;
  document_number: string;
  document_url: string | null;
  selfie_url: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
};

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "dl", label: "Driving License" },
];

export default function KycVerificationCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    account_type: "buyer",
    full_name: "",
    document_type: "aadhaar",
    document_number: "",
  });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const fetchKyc = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setKyc(data as KycRow | null);
    if (data) {
      setForm({
        account_type: data.account_type,
        full_name: data.full_name,
        document_type: data.document_type,
        document_number: data.document_number,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line
  }, [user]);

  const uploadFile = async (file: File, kind: "doc" | "selfie") => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, {
      upsert: true,
    });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.document_number.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!kyc && (!docFile || !selfieFile)) {
      toast.error("Please upload both ID document and selfie");
      return;
    }
    setSubmitting(true);
    try {
      let document_url = kyc?.document_url ?? null;
      let selfie_url = kyc?.selfie_url ?? null;
      if (docFile) document_url = await uploadFile(docFile, "doc");
      if (selfieFile) selfie_url = await uploadFile(selfieFile, "selfie");

      const payload = {
        user_id: user.id,
        account_type: form.account_type,
        full_name: form.full_name.trim(),
        document_type: form.document_type,
        document_number: form.document_number.trim(),
        document_url,
        selfie_url,
        status: "pending" as const,
      };

      const { error } = await supabase
        .from("kyc_verifications")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("KYC submitted for review");
      setDialogOpen(false);
      setDocFile(null);
      setSelfieFile(null);
      fetchKyc();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = () => {
    if (!kyc) return <Badge variant="outline">Not Submitted</Badge>;
    if (kyc.status === "verified")
      return <Badge className="bg-green-600 hover:bg-green-700"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    if (kyc.status === "rejected")
      return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><ShieldQuestion className="w-3 h-3 mr-1" />Pending Review</Badge>;
  };

  const canEdit = !kyc || kyc.status !== "verified";

  return (
    <Card className="gradient-card border-border/50 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="w-5 h-5 text-primary" />
          KYC Verification {statusBadge()}
        </CardTitle>
        <CardDescription>
          Verify your identity to unlock transactions, test drives, and price negotiations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : kyc ? (
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Name:</span> {kyc.full_name}</p>
            <p><span className="text-muted-foreground">Document:</span> {kyc.document_type.toUpperCase()} • ****{kyc.document_number.slice(-4)}</p>
            <p><span className="text-muted-foreground">Account type:</span> {kyc.account_type}</p>
            {kyc.admin_notes && (
              <p className="text-destructive">Admin notes: {kyc.admin_notes}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You have not submitted KYC yet. Submit your ID and a selfie for verification.
          </p>
        )}
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            {kyc ? "Update KYC" : "Submit KYC"}
          </Button>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>KYC Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>I am a</Label>
              <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller / Dealer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Full Legal Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Number *</Label>
                <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} maxLength={32} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Document Image {kyc?.document_url ? "(re-upload optional)" : "*"}</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>Selfie {kyc?.selfie_url ? "(re-upload optional)" : "*"}</Label>
              <Input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
