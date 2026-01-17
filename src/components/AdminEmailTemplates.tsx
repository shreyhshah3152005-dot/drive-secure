import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  Mail, 
  Save, 
  RotateCcw, 
  Eye, 
  Palette,
  FileText,
  Bell,
  Car,
  UserCheck,
  ArrowUp,
  Tag,
  Code
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  subject: string;
  bodyHtml: string;
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "test_drive_confirmation",
    name: "Test Drive Confirmation",
    description: "Sent when a customer submits a test drive request",
    icon: Car,
    subject: "🚗 Test Drive Request Confirmed - {{car_name}}",
    bodyHtml: `<h1>Thank you for your test drive request!</h1>
<p>Dear {{customer_name}},</p>
<p>We have received your test drive request for <strong>{{car_name}}</strong>.</p>
<p><strong>Requested Date:</strong> {{preferred_date}}<br/>
<strong>Requested Time:</strong> {{preferred_time}}</p>
<p>The dealer will contact you shortly to confirm the appointment.</p>
<p>Best regards,<br/>CARBAZAAR Team</p>`,
    variables: ["customer_name", "car_name", "preferred_date", "preferred_time", "dealer_name"]
  },
  {
    id: "test_drive_status",
    name: "Test Drive Status Update",
    description: "Sent when test drive status is updated by admin",
    icon: Bell,
    subject: "📋 Test Drive Status Update - {{car_name}}",
    bodyHtml: `<h1>Test Drive Status Updated</h1>
<p>Dear {{customer_name}},</p>
<p>Your test drive request for <strong>{{car_name}}</strong> has been updated.</p>
<p><strong>Previous Status:</strong> {{old_status}}<br/>
<strong>New Status:</strong> {{new_status}}</p>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br/>CARBAZAAR Team</p>`,
    variables: ["customer_name", "car_name", "old_status", "new_status", "preferred_date"]
  },
  {
    id: "dealer_approval",
    name: "Dealer Approval/Rejection",
    description: "Sent when a dealer application is approved or rejected",
    icon: UserCheck,
    subject: "{{status_emoji}} Dealer Registration {{status}} - CARBAZAAR",
    bodyHtml: `<h1>Dealer Registration {{status}}</h1>
<p>Dear {{dealership_name}},</p>
<p>{{status_message}}</p>
{{#if approved}}
<p>You can now log in to your dealer panel and start listing your vehicles.</p>
{{else}}
<p>If you believe this was in error, please contact our support team.</p>
{{/if}}
<p>Best regards,<br/>CARBAZAAR Team</p>`,
    variables: ["dealership_name", "status", "status_emoji", "status_message"]
  },
  {
    id: "subscription_update",
    name: "Subscription Plan Update",
    description: "Sent when a dealer's subscription plan is changed",
    icon: ArrowUp,
    subject: "{{emoji}} Your Subscription Plan Has Been {{action}}",
    bodyHtml: `<h1>Subscription Update</h1>
<p>Dear {{dealership_name}},</p>
<p>Your subscription plan has been {{action}}.</p>
<p><strong>Previous Plan:</strong> {{old_plan}}<br/>
<strong>New Plan:</strong> {{new_plan}}<br/>
<strong>Price:</strong> {{plan_price}}<br/>
<strong>Listing Limit:</strong> {{plan_limit}}</p>
<p>Log in to your dealer panel to take advantage of your updated plan.</p>
<p>Best regards,<br/>CARBAZAAR Team</p>`,
    variables: ["dealership_name", "old_plan", "new_plan", "plan_price", "plan_limit", "action", "emoji"]
  },
  {
    id: "price_alert",
    name: "Price Drop Alert",
    description: "Sent when a car's price drops to user's target",
    icon: Tag,
    subject: "🎉 Price Drop Alert - {{car_name}}",
    bodyHtml: `<h1>Great News! Price Dropped!</h1>
<p>Dear Customer,</p>
<p>The price for <strong>{{car_name}}</strong> has dropped!</p>
<p><strong>Original Price:</strong> {{original_price}}<br/>
<strong>New Price:</strong> {{new_price}}<br/>
<strong>Your Target:</strong> {{target_price}}</p>
<p><a href="{{car_link}}">View the car now</a> before it's gone!</p>
<p>Best regards,<br/>CARBAZAAR Team</p>`,
    variables: ["car_name", "original_price", "new_price", "target_price", "car_link"]
  }
];

const brandingDefaults = {
  primaryColor: "#b8860b",
  secondaryColor: "#1a1a1a",
  logoUrl: "",
  companyName: "CARBAZAAR",
  footerText: "This is an automated message from CARBAZAAR. Please do not reply directly to this email.",
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: ""
  }
};

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [branding, setBranding] = useState(brandingDefaults);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.bodyHtml);
    setShowPreview(false);
  };

  const saveTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, subject: editedSubject, bodyHtml: editedBody }
        : t
    );
    setTemplates(updatedTemplates);
    setSelectedTemplate({ ...selectedTemplate, subject: editedSubject, bodyHtml: editedBody });
    
    // In a real app, this would save to the database
    toast.success("Template saved successfully!");
  };

  const resetTemplate = () => {
    const original = defaultTemplates.find(t => t.id === selectedTemplate?.id);
    if (original) {
      setEditedSubject(original.subject);
      setEditedBody(original.bodyHtml);
      toast.info("Template reset to default");
    }
  };

  const generatePreview = () => {
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      customer_name: "John Doe",
      car_name: "2024 Tesla Model 3",
      preferred_date: "January 20, 2026",
      preferred_time: "2:00 PM",
      dealer_name: "Premium Auto Mall",
      dealership_name: "Premium Auto Mall",
      old_status: "Pending",
      new_status: "Confirmed",
      status: "Approved",
      status_emoji: "🎉",
      status_message: "Congratulations! Your dealer registration has been approved.",
      old_plan: "Basic",
      new_plan: "Premium",
      plan_price: "₹3,999/month",
      plan_limit: "Unlimited car listings",
      action: "upgraded",
      emoji: "🎉",
      original_price: "₹45,00,000",
      new_price: "₹42,00,000",
      target_price: "₹43,00,000",
      car_link: "https://carbazaar.com/car/123"
    };

    let preview = editedBody;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Wrap in email wrapper
    setPreviewHtml(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, ${branding.primaryColor}, #daa520); 
            padding: 30px; 
            text-align: center; 
            color: white;
          }
          .header h2 { margin: 0; }
          .content { padding: 30px; }
          .footer { 
            background: ${branding.secondaryColor}; 
            padding: 20px; 
            text-align: center; 
            color: #888;
            font-size: 12px;
          }
          h1 { color: #333; }
          a { color: ${branding.primaryColor}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚗 ${branding.companyName}</h2>
          </div>
          <div class="content">
            ${preview}
          </div>
          <div class="footer">
            <p>${branding.footerText}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template List */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Select a template to customize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div
                        key={template.id}
                        onClick={() => selectTemplate(template)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? "bg-primary/10 border border-primary"
                            : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${selectedTemplate?.id === template.id ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Template Editor */}
            <Card className="gradient-card border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  {selectedTemplate ? `Edit: ${selectedTemplate.name}` : "Template Editor"}
                </CardTitle>
                {selectedTemplate && (
                  <CardDescription>
                    Customize the email content and preview changes
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a template to start editing</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject Line</label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Email subject..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Body (HTML)</label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="variables">
                        <AccordionTrigger className="text-sm">
                          Available Variables
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="font-mono text-xs">
                                {"{{" + variable + "}}"}
                              </Badge>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={generatePreview} variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                      <Button onClick={resetTemplate} variant="outline" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                      <Button onClick={saveTemplate} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Template
                      </Button>
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="mt-4">
                        <label className="text-sm font-medium mb-2 block">Preview</label>
                        <div className="border rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            srcDoc={previewHtml}
                            className="w-full h-[400px] bg-white"
                            title="Email Preview"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Email Branding
              </CardTitle>
              <CardDescription>
                Customize the look and feel of all email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name</label>
                    <Input
                      value={branding.companyName}
                      onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        placeholder="#b8860b"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Secondary Color (Footer)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        placeholder="#1a1a1a"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Logo URL (Optional)</label>
                    <Input
                      value={branding.logoUrl}
                      onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Footer Text</label>
                    <Textarea
                      value={branding.footerText}
                      onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Branding Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEmailTemplates;
