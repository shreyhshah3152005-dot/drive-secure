import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, AreaChart, Area } from "recharts";
import { Calculator, IndianRupee, Percent, Calendar, BarChart3, TableIcon, CreditCard } from "lucide-react";

const CIBIL_RANGES = [
  { label: "Excellent (750-900)", value: "excellent", rate: 8.0 },
  { label: "Good (700-749)", value: "good", rate: 9.0 },
  { label: "Fair (650-699)", value: "fair", rate: 11.0 },
  { label: "Average (550-649)", value: "average", rate: 14.0 },
  { label: "Poor (300-549)", value: "poor", rate: 18.0 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

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

interface CarFinanceCalculatorProps {
  carPrice: number;
  carName?: string;
}

const CarFinanceCalculator = ({ carPrice, carName }: CarFinanceCalculatorProps) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenure, setTenure] = useState(60);
  const [cibilRange, setCibilRange] = useState("excellent");

  const selectedCibil = CIBIL_RANGES.find(c => c.value === cibilRange) || CIBIL_RANGES[0];
  const interestRate = selectedCibil.rate;
  const downPayment = (carPrice * downPaymentPercent) / 100;
  const loanAmount = carPrice - downPayment;

  const totalEMI = Math.round(calcEMI(loanAmount, interestRate, tenure));
  const totalPayment = totalEMI * tenure;
  const totalInterest = totalPayment - loanAmount;

  const amortization = useMemo(() => {
    const r = interestRate / 12 / 100;
    const emi = calcEMI(loanAmount, interestRate, tenure);
    let balance = loanAmount;
    const schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[] = [];
    for (let m = 1; m <= tenure; m++) {
      const interest = balance * r;
      const principal = emi - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({ month: m, emi: Math.round(emi), principal: Math.round(principal), interest: Math.round(interest), balance: Math.round(balance) });
    }
    return schedule;
  }, [loanAmount, interestRate, tenure]);

  const pieData = [
    { name: "Principal", value: Math.round(loanAmount) },
    { name: "Interest", value: Math.round(totalInterest) },
    { name: "Down Payment", value: Math.round(downPayment) },
  ];

  const yearlySummary = useMemo(() => {
    const years: { year: string; principal: number; interest: number }[] = [];
    for (let y = 0; y < Math.ceil(tenure / 12); y++) {
      const start = y * 12;
      const end = Math.min(start + 12, tenure);
      const slice = amortization.slice(start, end);
      years.push({
        year: `Year ${y + 1}`,
        principal: slice.reduce((s, r) => s + r.principal, 0),
        interest: slice.reduce((s, r) => s + r.interest, 0),
      });
    }
    return years;
  }, [amortization, tenure]);

  const chartConfig = {
    principal: { label: "Principal", color: "hsl(var(--primary))" },
    interest: { label: "Interest", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Calculator className="w-6 h-6 text-primary" />
        Finance Calculator
        {carName && <span className="text-muted-foreground text-lg font-normal">— {carName}</span>}
      </h2>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-secondary/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Car Price (Fixed)</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(carPrice)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />CIBIL Score Range
              </label>
              <span className="text-sm font-semibold text-primary">{interestRate}% p.a.</span>
            </div>
            <Select value={cibilRange} onValueChange={setCibilRange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CIBIL_RANGES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label} — {c.rate}% p.a.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />Down Payment
              </label>
              <span className="text-sm font-semibold text-primary">{downPaymentPercent}% ({formatCurrency(downPayment)})</span>
            </div>
            <Slider value={[downPaymentPercent]} onValueChange={v => setDownPaymentPercent(v[0])} min={10} max={90} step={5} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />Loan Tenure
              </label>
              <span className="text-sm font-semibold text-primary">{tenure} months</span>
            </div>
            <Slider value={[tenure]} onValueChange={v => setTenure(v[0])} min={12} max={84} step={6} />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Monthly EMI</p>
          <p className="text-xl font-bold text-primary">₹{totalEMI.toLocaleString("en-IN")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
          <p className="text-xl font-bold">{formatCurrency(loanAmount)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalInterest)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Payable</p>
          <p className="text-xl font-bold">{formatCurrency(totalPayment + downPayment)}</p>
        </CardContent></Card>
      </div>

      {/* Charts + Schedule */}
      <Tabs defaultValue="charts">
        <TabsList className="mb-4">
          <TabsTrigger value="charts" className="gap-2"><BarChart3 className="w-4 h-4" />Charts</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2"><TableIcon className="w-4 h-4" />Amortization</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yearly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlySummary}>
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="principal" stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="interest" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={amortization.filter((_, i) => i % 3 === 0 || i === amortization.length - 1)}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} name="Balance" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Month</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">EMI</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Principal</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Interest</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortization.map(row => (
                      <tr key={row.month} className="border-b border-border/30 hover:bg-secondary/20">
                        <td className="p-3">{row.month}</td>
                        <td className="p-3 text-right">₹{row.emi.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right text-primary">₹{row.principal.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right text-muted-foreground">₹{row.interest.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right font-medium">₹{row.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarFinanceCalculator;
