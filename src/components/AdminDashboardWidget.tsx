import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { 
  Bell, 
  Users, 
  Store, 
  Car, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  Calendar,
  User,
  Activity
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";

interface QuickStats {
  totalUsers: number;
  newUsersToday: number;
  totalDealers: number;
  pendingDealers: number;
  totalTestDrives: number;
  pendingTestDrives: number;
  totalCars: number;
  pendingUpgradeRequests: number;
}

interface RecentActivity {
  id: string;
  type: "user_signup" | "dealer_signup" | "test_drive" | "upgrade_request";
  title: string;
  timestamp: string;
}

const AdminDashboardWidget = () => {
  const { notifications, unreadCount, markAsRead, isLoading: notificationsLoading } = useAdminNotifications();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions for live updates
    const profilesChannel = supabase
      .channel("dashboard-profiles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const dealersChannel = supabase
      .channel("dashboard-dealers")
      .on("postgres_changes", { event: "*", schema: "public", table: "dealers" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const testDrivesChannel = supabase
      .channel("dashboard-test-drives")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "test_drive_inquiries" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(dealersChannel);
      supabase.removeChannel(testDrivesChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Fetch all stats in parallel
      const [
        usersResult,
        newUsersResult,
        dealersResult,
        pendingDealersResult,
        testDrivesResult,
        pendingTestDrivesResult,
        carsResult,
        upgradeRequestsResult,
        recentProfilesResult,
        recentDealersResult,
        recentTestDrivesResult
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
        supabase.from("dealers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("dealers").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("test_drive_inquiries").select("id", { count: "exact", head: true }),
        supabase.from("test_drive_inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("dealer_cars").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("subscription_upgrade_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("dealers").select("id, dealership_name, created_at").eq("is_active", false).order("created_at", { ascending: false }).limit(3),
        supabase.from("test_drive_inquiries").select("id, car_name, created_at").order("created_at", { ascending: false }).limit(3)
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        newUsersToday: newUsersResult.count || 0,
        totalDealers: dealersResult.count || 0,
        pendingDealers: pendingDealersResult.count || 0,
        totalTestDrives: testDrivesResult.count || 0,
        pendingTestDrives: pendingTestDrivesResult.count || 0,
        totalCars: carsResult.count || 0,
        pendingUpgradeRequests: upgradeRequestsResult.count || 0,
      });

      // Combine and sort recent activity
      const activities: RecentActivity[] = [];
      
      recentProfilesResult.data?.forEach(p => {
        activities.push({
          id: `user-${p.id}`,
          type: "user_signup",
          title: `New user: ${p.name || "Anonymous"}`,
          timestamp: p.created_at
        });
      });
      
      recentDealersResult.data?.forEach(d => {
        activities.push({
          id: `dealer-${d.id}`,
          type: "dealer_signup",
          title: `New dealer request: ${d.dealership_name}`,
          timestamp: d.created_at
        });
      });
      
      recentTestDrivesResult.data?.forEach(t => {
        activities.push({
          id: `test-${t.id}`,
          type: "test_drive",
          title: `Test drive request: ${t.car_name}`,
          timestamp: t.created_at
        });
      });

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "user_signup":
        return <User className="w-4 h-4 text-blue-500" />;
      case "dealer_signup":
        return <Store className="w-4 h-4 text-amber-500" />;
      case "test_drive":
        return <Car className="w-4 h-4 text-green-500" />;
      case "upgrade_request":
        return <ArrowUp className="w-4 h-4 text-purple-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="gradient-card border-border/50">
            <CardContent className="py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Stats */}
      <Card className="gradient-card border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Stats
          </CardTitle>
          <CardDescription>Real-time platform overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              {stats?.newUsersToday && stats.newUsersToday > 0 && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.newUsersToday} today
                </p>
              )}
            </div>

            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Dealers</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalDealers || 0}</p>
              {stats?.pendingDealers && stats.pendingDealers > 0 && (
                <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {stats.pendingDealers} pending
                </p>
              )}
            </div>

            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Test Drives</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalTestDrives || 0}</p>
              {stats?.pendingTestDrives && stats.pendingTestDrives > 0 && (
                <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {stats.pendingTestDrives} pending
                </p>
              )}
            </div>

            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Upgrades</span>
              </div>
              <p className="text-2xl font-bold">{stats?.pendingUpgradeRequests || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">pending requests</p>
            </div>
          </div>

          {/* Action Items */}
          {((stats?.pendingDealers ?? 0) > 0 || (stats?.pendingTestDrives ?? 0) > 0 || (stats?.pendingUpgradeRequests ?? 0) > 0) && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Action Required
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {(stats?.pendingDealers ?? 0) > 0 && (
                  <li>• {stats?.pendingDealers} dealer approval(s) pending</li>
                )}
                {(stats?.pendingTestDrives ?? 0) > 0 && (
                  <li>• {stats?.pendingTestDrives} test drive request(s) pending</li>
                )}
                {(stats?.pendingUpgradeRequests ?? 0) > 0 && (
                  <li>• {stats?.pendingUpgradeRequests} upgrade request(s) pending</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Panel */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            {notificationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      !notification.is_read 
                        ? "bg-primary/5 hover:bg-primary/10" 
                        : "bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-full ${!notification.is_read ? "bg-primary/10" : "bg-muted"}`}>
                        {notification.type === "test_drive_request" ? (
                          <Calendar className="w-3 h-3 text-primary" />
                        ) : (
                          <User className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm line-clamp-1 ${!notification.is_read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="gradient-card border-border/50 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 bg-secondary/30 rounded-xl flex items-center gap-3"
              >
                <div className="p-2 bg-background rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardWidget;
