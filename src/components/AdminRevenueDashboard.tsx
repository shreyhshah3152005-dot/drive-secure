import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DollarSign, TrendingUp, Users, UserPlus, Calendar, Percent } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RevenueData {
  month: string;
  revenue: number;
  signups: number;
}

interface PlanDistribution {
  name: string;
  value: number;
  color: string;
}

const subscriptionPrices: Record<string, number> = {
  free: 0,
  basic: 999,
  standard: 1999,
  premium: 3999,
};

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  basic: "#22c55e",
  standard: "#3b82f6",
  premium: "#f59e0b",
};

const AdminRevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    totalDealers: 0,
    activeDealers: 0,
    conversionRate: 0,
    churnRate: 0,
    avgRevenuePerDealer: 0,
    newDealersThisMonth: 0,
  });
  const [timeRange, setTimeRange] = useState("12");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const monthsBack = parseInt(timeRange);
      const startDate = subMonths(new Date(), monthsBack);
      const months = eachMonthOfInterval({ start: startDate, end: new Date() });

      // Fetch all dealers
      const { data: dealers, error: dealersError } = await supabase
        .from("dealers")
        .select("*");

      if (dealersError) throw dealersError;

      // Calculate MRR from active dealers
      let mrr = 0;
      const planCounts: Record<string, number> = { free: 0, basic: 0, standard: 0, premium: 0 };
      
      (dealers || []).forEach((dealer) => {
        if (dealer.is_active) {
          mrr += subscriptionPrices[dealer.subscription_plan] || 0;
        }
        planCounts[dealer.subscription_plan] = (planCounts[dealer.subscription_plan] || 0) + 1;
      });

      const activeDealers = (dealers || []).filter(d => d.is_active).length;
      const totalDealers = dealers?.length || 0;

      // Calculate new dealers this month
      const startOfCurrentMonth = startOfMonth(new Date());
      const newDealersThisMonth = (dealers || []).filter(
        d => new Date(d.created_at) >= startOfCurrentMonth
      ).length;

      // Calculate conversion rate (active/total)
      const conversionRate = totalDealers > 0 
        ? Math.round((activeDealers / totalDealers) * 100) 
        : 0;

      // Calculate revenue per dealer
      const avgRevenuePerDealer = activeDealers > 0 
        ? Math.round(mrr / activeDealers) 
        : 0;

      // Build monthly data
      const monthlyData: RevenueData[] = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const dealersInMonth = (dealers || []).filter(
          d => new Date(d.created_at) <= monthEnd && d.is_active
        );
        
        const monthRevenue = dealersInMonth.reduce(
          (sum, d) => sum + (subscriptionPrices[d.subscription_plan] || 0),
          0
        );

        const signupsInMonth = (dealers || []).filter(
          d => {
            const createdAt = new Date(d.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }
        ).length;

        return {
          month: format(month, "MMM yy"),
          revenue: monthRevenue,
          signups: signupsInMonth,
        };
      });

      // Build plan distribution
      const distribution: PlanDistribution[] = Object.entries(planCounts)
        .filter(([_, count]) => count > 0)
        .map(([plan, count]) => ({
          name: plan.charAt(0).toUpperCase() + plan.slice(1),
          value: count,
          color: PLAN_COLORS[plan],
        }));

      setRevenueData(monthlyData);
      setPlanDistribution(distribution);
      setMetrics({
        mrr,
        arr: mrr * 12,
        totalDealers,
        activeDealers,
        conversionRate,
        churnRate: Math.round((1 - activeDealers / Math.max(totalDealers, 1)) * 100),
        avgRevenuePerDealer,
        newDealersThisMonth,
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted rounded-t-lg" />
            <CardContent className="h-16 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Revenue Analytics</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Monthly Recurring Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {formatCurrency(metrics.mrr)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              MRR from {metrics.activeDealers} active dealers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Annual Recurring Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {formatCurrency(metrics.arr)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Projected yearly revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Avg Revenue/Dealer
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {formatCurrency(metrics.avgRevenuePerDealer)}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Per active dealer/month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              New This Month
            </CardTitle>
            <UserPlus className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
              {metrics.newDealersThisMonth}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              New dealer signups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDealers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeDealers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Active vs Total dealers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              Inactive dealers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly recurring revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Dealers by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {planDistribution.map((plan) => (
                <div key={plan.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-sm">{plan.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dealer Signups */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dealer Signups</CardTitle>
            <CardDescription>New dealer registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [value, "Signups"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))"
                    }}
                  />
                  <Bar dataKey="signups" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRevenueDashboard;
