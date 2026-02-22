import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, IndianRupee, Percent, Calendar, Building2, Check } from "lucide-react";

const BANKS = [
  { name: "SBI", rate: 8.5, maxTenure: 84 },
  { name: "HDFC Bank", rate: 8.75, maxTenure: 84 },
  { name: "ICICI Bank", rate: 8.9, maxTenure: 84 },
  { name: "Axis Bank", rate: 9.0, maxTenure: 72 },
  { name: "Bank of Baroda", rate: 8.3, maxTenure: 84 },
  { name: "Kotak Mahindra", rate: 9.1, maxTenure: 60 },
  { name: "Punjab National Bank", rate: 8.45, maxTenure: 84 },
  { name: "Canara Bank", rate: 8.65, maxTenure: 72 },
];

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const calcEMI = (principal: number, annualRate: number, months: number) => {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

const FinanceCalculator = () => {
  const [carPrice, setCarPrice] = useState(1500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenure, setTenure] = useState(60);

  const comparisons = useMemo(() => {
    const downPayment = (carPrice * downPaymentPercent) / 100;
    const loanAmount = carPrice - downPayment;

    return BANKS.map(bank => {
      const effectiveTenure = Math.min(tenure, bank.maxTenure);
      const emi = Math.round(calcEMI(loanAmount, bank.rate, effectiveTenure));
      const totalPayment = emi * effectiveTenure;
      const totalInterest = totalPayment - loanAmount;

      return {
        ...bank,
        effectiveTenure,
        emi,
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        loanAmount,
      };
    }).sort((a, b) => a.emi - b.emi);
  }, [carPrice, downPaymentPercent, tenure]);

  const bestBank = comparisons[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium tracking-wider uppercase rounded-full border border-primary/30 text-primary bg-primary/10">
              <Calculator className="w-4 h-4" />
              Finance Calculator
            </span>
            <h1 className="text-4xl font-bold mb-4">
              Compare <span className="text-gradient-primary">EMI Options</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compare car loan EMIs across top Indian banks to find the best deal
            </p>
          </div>

          {/* Controls */}
          <div className="max-w-2xl mx-auto mb-10">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-primary" />Car Price
                    </label>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(carPrice)}</span>
                  </div>
                  <Slider value={[carPrice]} onValueChange={v => setCarPrice(v[0])} min={300000} max={10000000} step={100000} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>₹3L</span><span>₹1Cr</span></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />Down Payment
                    </label>
                    <span className="text-sm font-semibold text-primary">{downPaymentPercent}% ({formatCurrency((carPrice * downPaymentPercent) / 100)})</span>
                  </div>
                  <Slider value={[downPaymentPercent]} onValueChange={v => setDownPaymentPercent(v[0])} min={10} max={90} step={5} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />Tenure
                    </label>
                    <span className="text-sm font-semibold text-primary">{tenure} months</span>
                  </div>
                  <Slider value={[tenure]} onValueChange={v => setTenure(v[0])} min={12} max={84} step={6} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Comparison Table */}
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4">
              {comparisons.map((bank, index) => (
                <Card key={bank.name} className={`transition-all ${index === 0 ? 'border-primary/50 shadow-lg shadow-primary/10' : 'hover:border-primary/30'}`}>
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{bank.name}</h3>
                          {index === 0 && (
                            <Badge className="text-xs gap-1"><Check className="w-3 h-3" />Best</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{bank.rate}% p.a. · Up to {bank.maxTenure} months</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Monthly EMI</p>
                        <p className="font-bold text-foreground">₹{bank.emi.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-muted-foreground">Total Interest</p>
                        <p className="font-semibold text-muted-foreground">{formatCurrency(bank.totalInterest)}</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-muted-foreground">Total Payable</p>
                        <p className="font-semibold text-muted-foreground">{formatCurrency(bank.totalPayment + (carPrice * downPaymentPercent) / 100)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FinanceCalculator;
