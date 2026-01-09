import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";

interface PriceHistoryProps {
  carId: string;
  carName: string;
}

interface PriceRecord {
  id: string;
  price: number;
  recorded_at: string;
}

const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(price / 100000).toFixed(2)} L`;
};

const PriceHistoryChart = ({ carId, carName }: PriceHistoryProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("price_history")
          .select("*")
          .eq("car_id", carId)
          .order("recorded_at", { ascending: true });

        if (error) throw error;
        setPriceHistory(data || []);
      } catch (error) {
        console.error("Error fetching price history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [carId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length < 2) {
    return null; // Don't show chart if there's only one price point
  }

  const chartData = priceHistory.map((record) => ({
    date: format(new Date(record.recorded_at), "MMM dd"),
    price: Number(record.price),
    fullDate: format(new Date(record.recorded_at), "MMM dd, yyyy"),
  }));

  const firstPrice = priceHistory[0]?.price || 0;
  const lastPrice = priceHistory[priceHistory.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Price History</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            {priceChange > 0 ? (
              <span className="text-red-500 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{percentChange}%
              </span>
            ) : priceChange < 0 ? (
              <span className="text-green-500 flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                {percentChange}%
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center">
                <Minus className="w-4 h-4 mr-1" />
                No change
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatPrice(value)}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), "Price"]}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Showing {priceHistory.length} price updates since {format(new Date(priceHistory[0].recorded_at), "MMM dd, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;
