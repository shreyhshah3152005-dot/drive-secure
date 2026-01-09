import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Car, Calendar, CheckCircle, Target } from "lucide-react";

interface DealerCar {
  id: string;
  name: string;
  brand: string;
  category: string;
  is_active: boolean;
}

interface TestDriveInquiry {
  id: string;
  car_name: string;
  status: string;
  created_at: string;
}

interface DealerAnalyticsProps {
  cars: DealerCar[];
  testDrives: TestDriveInquiry[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const DealerAnalytics = ({ cars, testDrives }: DealerAnalyticsProps) => {
  // Calculate conversion rate
  const conversionStats = useMemo(() => {
    const total = testDrives.length;
    const completed = testDrives.filter(t => t.status === "completed").length;
    const pending = testDrives.filter(t => t.status === "pending").length;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
    
    return { total, completed, pending, rate };
  }, [testDrives]);

  // Popular cars by test drive requests
  const popularCars = useMemo(() => {
    const carRequests: Record<string, number> = {};
    
    testDrives.forEach(td => {
      carRequests[td.car_name] = (carRequests[td.car_name] || 0) + 1;
    });

    return Object.entries(carRequests)
      .map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + "..." : name, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);
  }, [testDrives]);

  // Test drives by status (pie chart)
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    testDrives.forEach(td => {
      statusCounts[td.status] = (statusCounts[td.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [testDrives]);

  // Test drives over time (last 7 days)
  const testDrivesTrend = useMemo(() => {
    const last7Days: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[dateStr] = 0;
    }

    testDrives.forEach(td => {
      const date = new Date(td.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 6) {
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr]++;
        }
      }
    });

    return Object.entries(last7Days).map(([day, count]) => ({ day, requests: count }));
  }, [testDrives]);

  // Cars by category
  const carsByCategory = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    
    cars.filter(c => c.is_active).forEach(car => {
      categoryCounts[car.category] = (categoryCounts[car.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));
  }, [cars]);

  const chartConfig = {
    requests: { label: "Requests", color: "hsl(var(--primary))" },
    count: { label: "Cars", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{conversionStats.rate}%</div>
            <p className="text-xs text-muted-foreground">Test drives → Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversionStats.total}</div>
            <p className="text-xs text-muted-foreground">All time test drive requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{conversionStats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cars.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Cars currently listed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Cars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Requested Cars
            </CardTitle>
            <CardDescription>Cars with highest test drive requests</CardDescription>
          </CardHeader>
          <CardContent>
            {popularCars.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularCars} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="requests" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No test drive data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Drive Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Drive Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No test drive data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Drives Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
            <CardDescription>Test drive requests over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testDrivesTrend}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cars by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Active car listings by category</CardDescription>
          </CardHeader>
          <CardContent>
            {carsByCategory.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={carsByCategory}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No active listings
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealerAnalytics;
