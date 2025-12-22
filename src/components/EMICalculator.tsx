import { useState, useMemo } from "react";
import { Calculator, IndianRupee, Percent, Calendar } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface EMICalculatorProps {
  carPrice: number;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const EMICalculator = ({ carPrice }: EMICalculatorProps) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(60);

  const calculations = useMemo(() => {
    const downPayment = (carPrice * downPaymentPercent) / 100;
    const loanAmount = carPrice - downPayment;
    const monthlyRate = interestRate / 12 / 100;
    
    let emi = 0;
    if (monthlyRate > 0) {
      emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
            (Math.pow(1 + monthlyRate, tenure) - 1);
    } else {
      emi = loanAmount / tenure;
    }

    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - loanAmount;

    return {
      downPayment,
      loanAmount,
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
    };
  }, [carPrice, downPaymentPercent, interestRate, tenure]);

  return (
    <div className="gradient-card rounded-2xl border border-border/50 p-6 lg:p-8">
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Calculator className="w-6 h-6 text-primary" />
        EMI Calculator
      </h3>

      <div className="space-y-6">
        {/* Car Price Display */}
        <div className="p-4 bg-secondary/30 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Car Price</p>
          <p className="text-2xl font-bold text-gradient-gold">{formatCurrency(carPrice)}</p>
        </div>

        {/* Down Payment Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Down Payment
            </label>
            <span className="text-sm font-semibold text-primary">
              {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
            </span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(value) => setDownPaymentPercent(value[0])}
            min={10}
            max={90}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10%</span>
            <span>90%</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              Interest Rate
            </label>
            <span className="text-sm font-semibold text-primary">{interestRate}% p.a.</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={6}
            max={18}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>6%</span>
            <span>18%</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Loan Tenure
            </label>
            <span className="text-sm font-semibold text-primary">{tenure} months</span>
          </div>
          <Slider
            value={[tenure]}
            onValueChange={(value) => setTenure(value[0])}
            min={12}
            max={84}
            step={6}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12 months</span>
            <span>84 months</span>
          </div>
        </div>

        {/* EMI Result */}
        <div className="mt-8 p-6 gradient-gold rounded-xl text-center">
          <p className="text-primary-foreground/80 text-sm mb-1">Your Monthly EMI</p>
          <p className="text-4xl font-bold text-primary-foreground">
            ₹{calculations.emi.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
            <p className="font-semibold text-foreground">{formatCurrency(calculations.loanAmount)}</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
            <p className="font-semibold text-foreground">{formatCurrency(calculations.totalInterest)}</p>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-xl text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Amount Payable</p>
          <p className="font-semibold text-foreground text-lg">{formatCurrency(calculations.totalPayment + calculations.downPayment)}</p>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;