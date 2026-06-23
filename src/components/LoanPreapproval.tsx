import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Calculator, CheckCircle, XCircle, AlertTriangle, IndianRupee, Building2, Loader2 } from "lucide-react";

interface Bank {
  name: string;
  minCibil: number;
  maxLoanPercent: number;
  baseRate: number;
  maxTenure: number;
  processingFee: string;
}

const BANKS: Bank[] = [
  { name: "State Bank of India", minCibil: 650, maxLoanPercent: 90, baseRate: 8.5, maxTenure: 84, processingFee: "0.35%" },
  { name: "HDFC Bank", minCibil: 700, maxLoanPercent: 85, baseRate: 8.75, maxTenure: 84, processingFee: "0.50%" },
  { name: "ICICI Bank", minCibil: 700, maxLoanPercent: 85, baseRate: 9.0, maxTenure: 84, processingFee: "0.50%" },
  { name: "Axis Bank", minCibil: 700, maxLoanPercent: 80, baseRate: 9.25, maxTenure: 72, processingFee: "0.50%" },
  { name: "Bank of Baroda", minCibil: 625, maxLoanPercent: 90, baseRate: 8.6, maxTenure: 84, processingFee: "0.25%" },
  { name: "Kotak Mahindra Bank", minCibil: 725, maxLoanPercent: 80, baseRate: 9.1, maxTenure: 72, processingFee: "0.50%" },
  { name: "Punjab National Bank", minCibil: 600, maxLoanPercent: 85, baseRate: 8.95, maxTenure: 84, processingFee: "0.35%" },
];

const CIBIL_OPTIONS = [
  { value: "800", label: "Excellent (800-900)", score: 800 },
  { value: "750", label: "Very Good (750-799)", score: 750 },
  { value: "700", label: "Good (700-749)", score: 700 },
  { value: "650", label: "Fair (650-699)", score: 650 },
  { value: "600", label: "Below Average (600-649)", score: 600 },
  { value: "500", label: "Poor (Below 600)", score: 500 },
];

const calcEMI = (principal: number, annualRate: number, months: number) => {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

const formatCurrency = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

interface LoanPreapprovalProps {
  carPrice?: number; // in rupees
  carName?: string;
}

interface BankResult {
  bank: Bank;
  eligible: boolean;
  effectiveRate: number;
  emi: number;
  loanAmount: number;
  totalPayable: number;
  totalInterest: number;
}

const LoanPreapproval = ({ carPrice, carName }: LoanPreapprovalProps) => {
  const { user } = useAuth();
  const [cibilScore, setCibilScore] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenure, setTenure] = useState("60");
  const [results, setResults] = useState<BankResult[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const price = carPrice || 0;

  const getEffectiveRate = (bank: Bank, score: number) => {
    if (score >= 800) return bank.baseRate;
    if (score >= 750) return bank.baseRate + 0.5;
    if (score >= 700) return bank.baseRate + 1.0;
    if (score >= 650) return bank.baseRate + 2.5;
    return bank.baseRate + 4.0;
  };

  const handleCalculate = async () => {
    if (!cibilScore || !annualIncome || !price) {
      const msg = "Please fill in CIBIL score, annual income, and ensure car price is set.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const score = parseInt(cibilScore);
      const income = parseFloat(annualIncome);
      const months = parseInt(tenure);

      if (Number.isNaN(score) || Number.isNaN(income) || income <= 0) {
        throw new Error("Please enter a valid annual income.");
      }

      const downPayment = (price * downPaymentPercent) / 100;
      const loanAmount = price - downPayment;
      const monthlyIncome = income / 12;

      const bankResults: BankResult[] = BANKS.map(bank => {
        const eligible = score >= bank.minCibil && months <= bank.maxTenure;
        const effectiveRate = getEffectiveRate(bank, score);
        const maxLoan = (price * bank.maxLoanPercent) / 100;
        const actualLoan = Math.min(loanAmount, maxLoan);
        const emi = Math.round(calcEMI(actualLoan, effectiveRate, months));
        const dti = (emi / monthlyIncome) * 100;

        return {
          bank,
          eligible: eligible && dti <= 50 && actualLoan === loanAmount,
          effectiveRate,
          emi,
          loanAmount: actualLoan,
          totalPayable: emi * months,
          totalInterest: (emi * months) - actualLoan,
        };
      });

      bankResults.sort((a, b) => {
        if (a.eligible && !b.eligible) return -1;
        if (!a.eligible && b.eligible) return 1;
        return a.effectiveRate - b.effectiveRate;
      });

      setResults(bankResults);
      setCalculated(true);

      if (user) {
        const best = bankResults.find(r => r.eligible);
        if (best) {
          const { error: dbError } = await supabase.from("loan_preapprovals").insert({
            user_id: user.id,
            car_price: price,
            down_payment: downPayment,
            loan_term: months,
            credit_score_range: CIBIL_OPTIONS.find(c => c.value === cibilScore)?.label || cibilScore,
            annual_income: income,
            monthly_payment: best.emi,
            interest_rate: best.effectiveRate,
            approval_status: "approved",
          });
          if (dbError) {
            console.error("Failed to save preapproval:", dbError);
            toast.error("Eligibility calculated, but we couldn't save it to your account.");
          }
        }
      }
    } catch (e: any) {
      const msg = e?.message || "Could not check eligibility. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Loan Pre-Approval
          {carName && <span className="text-sm font-normal text-muted-foreground">— {carName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {price > 0 && (
          <div className="p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Car Price (Fixed)</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(price)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CIBIL Score *</Label>
            <Select value={cibilScore} onValueChange={setCibilScore}>
              <SelectTrigger><SelectValue placeholder="Select score range" /></SelectTrigger>
              <SelectContent>
                {CIBIL_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Annual Income (₹) *</Label>
            <Input
              type="number"
              placeholder="e.g. 1200000"
              value={annualIncome}
              onChange={e => setAnnualIncome(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Down Payment</Label>
            <span className="font-medium text-primary">{downPaymentPercent}% ({formatCurrency((price * downPaymentPercent) / 100)})</span>
          </div>
          <Slider value={[downPaymentPercent]} onValueChange={v => setDownPaymentPercent(v[0])} min={10} max={80} step={5} />
        </div>

        <div className="space-y-2">
          <Label>Loan Tenure</Label>
          <Select value={tenure} onValueChange={setTenure}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[12, 24, 36, 48, 60, 72, 84].map(m => (
                <SelectItem key={m} value={String(m)}>{m} months ({m / 12} yrs)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCalculate} className="w-full" disabled={!cibilScore || !annualIncome || !price}>
          <Calculator className="w-4 h-4 mr-2" />
          Check Eligibility from {BANKS.length} Banks
        </Button>

        {calculated && (
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold text-base">Bank Eligibility Results</h3>
            {results.map(r => (
              <Card key={r.bank.name} className={r.eligible ? "border-green-500/30 bg-green-500/5" : "opacity-70"}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-sm truncate">{r.bank.name}</span>
                    </div>
                    {r.eligible ? (
                      <Badge className="bg-green-600 hover:bg-green-700 shrink-0"><CheckCircle className="w-3 h-3 mr-1" />Eligible</Badge>
                    ) : (
                      <Badge variant="destructive" className="shrink-0"><XCircle className="w-3 h-3 mr-1" />Not Eligible</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{r.effectiveRate.toFixed(2)}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly EMI</p>
                      <p className="font-semibold text-primary">₹{r.emi.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Interest</p>
                      <p className="font-semibold text-destructive">{formatCurrency(r.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processing Fee</p>
                      <p className="font-semibold">{r.bank.processingFee}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground">* Rates are indicative. Actual eligibility depends on bank's assessment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanPreapproval;
