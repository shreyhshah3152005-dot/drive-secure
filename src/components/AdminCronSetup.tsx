import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, ExternalLink, Copy, CheckCircle, Server } from "lucide-react";

const AdminCronSetup = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const functionUrl = "https://bubnuyyvxedsmeuwkune.supabase.co/functions/v1/send-test-drive-reminder";
  
  const curlCommand = `curl -X POST "${functionUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-cron-secret: YOUR_CRON_SECRET"`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Scheduled Tasks Setup
        </CardTitle>
        <CardDescription>
          Configure external cron services to run automated tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Drive Reminders */}
        <div className="p-5 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Test Drive Reminders</h3>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              Daily at 8:00 AM
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Sends email reminders to customers 24 hours before their scheduled test drives.
          </p>

          <div className="space-y-4">
            {/* Function URL */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Edge Function URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background p-3 rounded-lg text-sm break-all border">
                  {functionUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(functionUrl, "URL")}
                >
                  {copied === "URL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* cURL Command */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                cURL Command (for testing)
              </label>
              <div className="relative">
                <pre className="bg-background p-3 rounded-lg text-sm overflow-x-auto border">
                  {curlCommand}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(curlCommand, "cURL")}
                >
                  {copied === "cURL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Required Headers */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Required Headers
              </label>
              <div className="bg-background p-3 rounded-lg border space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Content-Type</Badge>
                  <span className="text-muted-foreground">application/json</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">x-cron-secret</Badge>
                  <span className="text-muted-foreground">Your CRON_SECRET value</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-semibold text-foreground mb-3">📋 Setup Instructions</h4>
          <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
            <li>
              Go to a cron service like{" "}
              <a 
                href="https://cron-job.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                cron-job.org <ExternalLink className="w-3 h-3" />
              </a>
              {" "}or{" "}
              <a 
                href="https://www.easycron.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                EasyCron <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Create a new cron job with the function URL above</li>
            <li>Set the HTTP method to <strong>POST</strong></li>
            <li>
              Add the required headers:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>Content-Type: application/json</code></li>
                <li><code>x-cron-secret: [your CRON_SECRET value]</code></li>
              </ul>
            </li>
            <li>Set the schedule to run daily at 8:00 AM (your timezone)</li>
            <li>Save and enable the cron job</li>
          </ol>
        </div>

        {/* Recommended Services */}
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="https://cron-job.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">cron-job.org</p>
              <p className="text-sm text-muted-foreground">Free tier available</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
          </a>
          
          <a
            href="https://www.easycron.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">EasyCron</p>
              <p className="text-sm text-muted-foreground">Free tier available</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCronSetup;
