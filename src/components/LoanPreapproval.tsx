import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Calculator, CheckCircle, TrendingUp, IndianRupee, Percent } from "lucide-react";

const creditScoreRanges = [
  { value: "excellent", label: "Excellent (750+)", rate: 8.5 },
  { value: "good", label: "Good (700-749)", rate: 9.5 },
  { value: "fair", label: "Fair (650-699)", rate: 11.0 },
  { value: "poor", label: "Below 650", rate: 14.0 },
];

const loanTerms = [
  { months: 12, label: "1 Year" },
  { months: 24, label: "2 Years" },
  { months: 36, label: "3 Years" },
  { months: 48, label: "4 Years" },
  { months: 60, label: "5 Years" },
  { months: 72, label: "6 Years" },
  { months: 84, label: "7 Years" },
];

interface PreapprovalResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  interestRate: number;
  loanAmount: number;
  loanTerm: number;
  approvalStatus: "approved" | "conditional" | "review";
}

const LoanPreapproval = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PreapprovalResult | null>(null);

  const [formData, setFormData] = useState({
    carPrice: "",
    downPayment: 20,
    loanTerm: "60",
    creditScore: "",
    annualIncome: "",
  });

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return emi;
  };

  const handleCalculate = async () => {
    if (!formData.carPrice || !formData.creditScore || !formData.annualIncome) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    try {
      const carPrice = parseFloat(formData.carPrice);
      const downPaymentAmount = (formData.downPayment / 100) * carPrice;
      const loanAmount = carPrice - downPaymentAmount;
      const loanTerm = parseInt(formData.loanTerm);
      const annualIncome = parseFloat(formData.annualIncome);

      const creditData = creditScoreRanges.find(c => c.value === formData.creditScore);
      const interestRate = creditData?.rate || 12;

      const monthlyPayment = calculateEMI(loanAmount, interestRate, loanTerm);
      const totalPayment = monthlyPayment * loanTerm;
      const totalInterest = totalPayment - loanAmount;

      // Determine approval status based on debt-to-income ratio
      const monthlyIncome = annualIncome / 12;
      const dti = (monthlyPayment / monthlyIncome) * 100;

      let approvalStatus: "approved" | "conditional" | "review";
      if (dti <= 30 && formData.creditScore !== "poor") {
        approvalStatus = "approved";
      } else if (dti <= 45) {
        approvalStatus = "conditional";
      } else {
        approvalStatus = "review";
      }

      const preapprovalResult: PreapprovalResult = {
        monthlyPayment: Math.round(monthlyPayment),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        interestRate,
        loanAmount,
        loanTerm,
        approvalStatus,
      };

      setResult(preapprovalResult);

      // Save to database
      if (user) {
        await supabase.from("loan_preapprovals").insert({
          user_id: user.id,
          car_price: carPrice,
          down_payment: downPaymentAmount,
          loan_term: loanTerm,
          credit_score_range: formData.creditScore,
          annual_income: annualIncome,
          monthly_payment: preapprovalResult.monthlyPayment,
          interest_rate: interestRate,
          approval_status: approvalStatus,
        });
      }
    } catch (error) {
      console.error("Error calculating loan:", error);
      toast.error("Failed to calculate loan");
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculator = () => {
    setFormData({
      carPrice: "",
      downPayment: 20,
      loanTerm: "60",
      creditScore: "",
      annualIncome: "",
    });
    setResult(null);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Pre-Approved</Badge>;
      case "conditional":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Conditionally Approved</Badge>;
      default:
        return <Badge variant="secondary">Needs Review</Badge>;
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Loan Pre-Approval
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Car Loan Pre-Approval
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div>
              <Label>Car Price (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g., 1500000"
                value={formData.carPrice}
                onChange={(e) => setFormData({ ...formData, carPrice: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Down Payment</Label>
                <span className="text-sm font-medium">{formData.downPayment}%</span>
              </div>
              <Slider
                value={[formData.downPayment]}
                onValueChange={(v) => setFormData({ ...formData, downPayment: v[0] })}
                min={10}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.carPrice && `Down payment: ${formatPrice((formData.downPayment / 100) * parseFloat(formData.carPrice))}`}
              </p>
            </div>

            <div>
              <Label>Loan Term *</Label>
              <Select value={formData.loanTerm} onValueChange={(v) => setFormData({ ...formData, loanTerm: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {loanTerms.map((term) => (
                    <SelectItem key={term.months} value={term.months.toString()}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit Score Range *</Label>
              <Select value={formData.creditScore} onValueChange={(v) => setFormData({ ...formData, creditScore: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select credit score" />
                </SelectTrigger>
                <SelectContent>
                  {creditScoreRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{range.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">~{range.rate}% APR</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Annual Income (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g., 1200000"
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleCalculate} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Check Pre-Approval
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getApprovalBadge(result.approvalStatus)}
                </div>
                <CardDescription>Estimated Monthly Payment</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">
                  {formatPrice(result.monthlyPayment)}/mo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Loan Amount
                    </p>
                    <p className="font-semibold">{formatPrice(result.loanAmount)}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Interest Rate
                    </p>
                    <p className="font-semibold">{result.interestRate}% APR</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">Total Interest</p>
                    <p className="font-semibold text-destructive">{formatPrice(result.totalInterest)}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">Total Payment</p>
                    <p className="font-semibold">{formatPrice(result.totalPayment)}</p>
                  </div>
                </div>

                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-muted-foreground text-sm mb-1">Loan Term</p>
                  <p className="font-medium">
                    {result.loanTerm} months ({Math.floor(result.loanTerm / 12)} years)
                  </p>
                </div>

                <div className="p-3 bg-blue-500/10 rounded-lg text-center text-sm">
                  <p className="text-muted-foreground">
                    💡 This is an estimate. Final rates depend on your complete financial profile and lender policies.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetCalculator}>
                    Calculate Another
                  </Button>
                  <Button className="flex-1" onClick={() => setDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoanPreapproval;
