import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Users, Store, Car, Calendar, TrendingUp, CheckCircle } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  city: string | null;
  created_at: string;
}

interface Dealer {
  id: string;
  dealership_name: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
}

interface TestDriveInquiry {
  id: string;
  car_name: string;
  status: string;
  created_at: string;
}

interface AdminAnalyticsProps {
  profiles: Profile[];
  dealers: Dealer[];
  testDrives: TestDriveInquiry[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AdminAnalytics = ({ profiles, dealers, testDrives }: AdminAnalyticsProps) => {
  // User registration trend (last 30 days)
  const userTrend = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[key] = 0;
    }

    profiles.forEach((profile) => {
      const date = new Date(profile.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[key] !== undefined) {
        days[key]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, users: count }));
  }, [profiles]);

  // Dealer registration trend
  const dealerTrend = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[key] = 0;
    }

    dealers.forEach((dealer) => {
      const date = new Date(dealer.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[key] !== undefined) {
        days[key]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, dealers: count }));
  }, [dealers]);

  // Users by city
  const usersByCity = useMemo(() => {
    const cityCounts: Record<string, number> = {};
    
    profiles.forEach((profile) => {
      const city = profile.city || "Unknown";
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([city, count]) => ({ city, count }));
  }, [profiles]);

  // Dealers by subscription plan
  const dealersByPlan = useMemo(() => {
    const plans: Record<string, number> = { free: 0, basic: 0, standard: 0, premium: 0 };
    
    dealers.forEach((dealer) => {
      const plan = dealer.subscription_plan || "free";
      if (plans[plan] !== undefined) {
        plans[plan]++;
      }
    });

    return Object.entries(plans).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [dealers]);

  // Test drive status distribution
  const testDriveStatus = useMemo(() => {
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    
    testDrives.forEach((td) => {
      if (statusCounts[td.status] !== undefined) {
        statusCounts[td.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [testDrives]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    if (testDrives.length === 0) return 0;
    const completed = testDrives.filter((td) => td.status === "completed").length;
    return Math.round((completed / testDrives.length) * 100);
  }, [testDrives]);

  const chartConfig = {
    users: { label: "Users", color: "hsl(var(--primary))" },
    dealers: { label: "Dealers", color: "hsl(var(--chart-2))" },
    count: { label: "Count", color: "hsl(var(--primary))" },
    value: { label: "Value", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-border/50">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profiles.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-chart-2/10">
              <Store className="w-6 h-6 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dealers.filter(d => d.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active Dealers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-chart-3/10">
              <Calendar className="w-6 h-6 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">{testDrives.length}</p>
              <p className="text-sm text-muted-foreground">Test Drives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Registration Trend */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            User Registration Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by City */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Users by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByCity} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="city" width={80} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Dealers by Subscription */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Dealers by Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealersByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dealersByPlan.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dealer Registration Trend */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Dealer Registration Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dealerTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="dealers" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Test Drive Status */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Test Drive Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testDriveStatus}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {testDriveStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === "Completed" ? "hsl(var(--chart-2))" :
                          entry.name === "Pending" ? "hsl(var(--chart-4))" :
                          entry.name === "Confirmed" ? "hsl(var(--primary))" :
                          "hsl(var(--chart-5))"
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
