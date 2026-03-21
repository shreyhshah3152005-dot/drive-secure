import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Calculator, IndianRupee, Percent, Calendar, Building2, Check, TableIcon, BarChart3 } from "lucide-react";

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

const FinanceCalculator = () => {
  const [carPrice, setCarPrice] = useState(1500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenure, setTenure] = useState(60);
  const [selectedRate, setSelectedRate] = useState(8.5);

  const downPayment = (carPrice * downPaymentPercent) / 100;
  const loanAmount = carPrice - downPayment;

  const comparisons = useMemo(() => {
    return BANKS.map(bank => {
      const effectiveTenure = Math.min(tenure, bank.maxTenure);
      const emi = Math.round(calcEMI(loanAmount, bank.rate, effectiveTenure));
      const totalPayment = emi * effectiveTenure;
      const totalInterest = totalPayment - loanAmount;
      return { ...bank, effectiveTenure, emi, totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest), loanAmount };
    }).sort((a, b) => a.emi - b.emi);
  }, [loanAmount, tenure]);

  // Amortization schedule for selected rate
  const amortization = useMemo(() => {
    const r = selectedRate / 12 / 100;
    const emi = calcEMI(loanAmount, selectedRate, tenure);
    let balance = loanAmount;
    const schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[] = [];

    for (let m = 1; m <= tenure; m++) {
      const interest = balance * r;
      const principal = emi - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({
        month: m,
        emi: Math.round(emi),
        principal: Math.round(principal),
        interest: Math.round(interest),
        balance: Math.round(balance),
      });
    }
    return schedule;
  }, [loanAmount, selectedRate, tenure]);

  const totalEMI = Math.round(calcEMI(loanAmount, selectedRate, tenure));
  const totalPayment = totalEMI * tenure;
  const totalInterest = totalPayment - loanAmount;

  // Pie chart data
  const pieData = [
    { name: "Principal", value: Math.round(loanAmount) },
    { name: "Interest", value: Math.round(totalInterest) },
    { name: "Down Payment", value: Math.round(downPayment) },
  ];

  // Yearly summary for area chart
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
              Compare car loan EMIs across top Indian banks with detailed amortization
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
                    <span className="text-sm font-semibold text-primary">{downPaymentPercent}% ({formatCurrency(downPayment)})</span>
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

          {/* Summary Cards */}
          <div className="max-w-4xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Monthly EMI</p>
                <p className="text-xl font-bold text-primary">₹{totalEMI.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-xl font-bold">{formatCurrency(loanAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalInterest)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Payable</p>
                <p className="text-xl font-bold">{formatCurrency(totalPayment + downPayment)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts + Amortization Tabs */}
          <div className="max-w-4xl mx-auto mb-10">
            <Tabs defaultValue="charts">
              <TabsList className="mb-4">
                <TabsTrigger value="charts" className="gap-2"><BarChart3 className="w-4 h-4" />Visual Charts</TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2"><TableIcon className="w-4 h-4" />Amortization Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="charts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Payment Breakdown</CardTitle>
                      <CardDescription>Principal vs Interest vs Down Payment</CardDescription>
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

                  {/* Yearly Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Yearly Breakdown</CardTitle>
                      <CardDescription>Principal & interest paid each year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={yearlySummary}>
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="principal" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="interest" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Balance Over Time */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Outstanding Balance Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={amortization.filter((_, i) => i % 3 === 0 || i === amortization.length - 1)}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: "Month", position: "insideBottom", offset: -5 }} />
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

          {/* Bank Comparison Table */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Bank <span className="text-gradient-primary">Comparisons</span></h2>
            <div className="grid gap-4">
              {comparisons.map((bank, index) => (
                <Card
                  key={bank.name}
                  className={`transition-all cursor-pointer ${index === 0 ? 'border-primary/50 shadow-lg shadow-primary/10' : 'hover:border-primary/30'} ${selectedRate === bank.rate ? 'ring-2 ring-primary/50' : ''}`}
                  onClick={() => setSelectedRate(bank.rate)}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{bank.name}</h3>
                          {index === 0 && <Badge className="text-xs gap-1"><Check className="w-3 h-3" />Best</Badge>}
                          {selectedRate === bank.rate && <Badge variant="outline" className="text-xs">Selected</Badge>}
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
                        <p className="font-semibold text-muted-foreground">{formatCurrency(bank.totalPayment + downPayment)}</p>
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
