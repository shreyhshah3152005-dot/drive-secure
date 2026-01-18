import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  Code,
  Loader2,
  History,
  Send,
  Clock,
  Users
} from "lucide-react";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  subject: string;
  body_html: string;
  variables: string[];
}

interface TemplateVersion {
  id: string;
  version_number: number;
  subject: string;
  body_html: string;
  change_description: string | null;
  created_at: string;
}

interface Branding {
  id?: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  company_name: string;
  footer_text: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
}

const defaultTemplates: Omit<EmailTemplate, 'id'>[] = [
  {
    template_key: "test_drive_confirmation",
    name: "Test Drive Confirmation",
    description: "Sent when a customer submits a test drive request",
    icon: Car,
    subject: "🚗 Test Drive Request Confirmed - {{car_name}}",
    body_html: `<h1>Thank you for your test drive request!</h1>
<p>Dear {{customer_name}},</p>
<p>We have received your test drive request for <strong>{{car_name}}</strong>.</p>
<p><strong>Requested Date:</strong> {{preferred_date}}<br/>
<strong>Requested Time:</strong> {{preferred_time}}</p>
<p>The dealer will contact you shortly to confirm the appointment.</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["customer_name", "car_name", "preferred_date", "preferred_time", "dealer_name", "company_name"]
  },
  {
    template_key: "test_drive_status",
    name: "Test Drive Status Update",
    description: "Sent when test drive status is updated by admin",
    icon: Bell,
    subject: "📋 Test Drive Status Update - {{car_name}}",
    body_html: `<h1>Test Drive Status Updated</h1>
<p>Dear {{customer_name}},</p>
<p>Your test drive request for <strong>{{car_name}}</strong> has been updated.</p>
<p><strong>Previous Status:</strong> {{old_status}}<br/>
<strong>New Status:</strong> {{new_status}}</p>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["customer_name", "car_name", "old_status", "new_status", "preferred_date", "company_name"]
  },
  {
    template_key: "dealer_approval",
    name: "Dealer Approval/Rejection",
    description: "Sent when a dealer application is approved or rejected",
    icon: UserCheck,
    subject: "{{status_emoji}} Dealer Registration {{status}} - {{company_name}}",
    body_html: `<h1>Dealer Registration {{status}}</h1>
<p>Dear {{dealership_name}},</p>
<p>{{status_message}}</p>
<p>{{next_steps}}</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["dealership_name", "status", "status_emoji", "status_message", "next_steps", "company_name"]
  },
  {
    template_key: "subscription_update",
    name: "Subscription Plan Update",
    description: "Sent when a dealer's subscription plan is changed",
    icon: ArrowUp,
    subject: "{{emoji}} Your Subscription Plan Has Been {{action}}",
    body_html: `<h1>Subscription Update</h1>
<p>Dear {{dealership_name}},</p>
<p>Your subscription plan has been {{action}}.</p>
<p><strong>Previous Plan:</strong> {{old_plan}}<br/>
<strong>New Plan:</strong> {{new_plan}}<br/>
<strong>Price:</strong> {{plan_price}}<br/>
<strong>Listing Limit:</strong> {{plan_limit}}</p>
<p>Log in to your dealer panel to take advantage of your updated plan.</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["dealership_name", "old_plan", "new_plan", "plan_price", "plan_limit", "action", "emoji", "company_name"]
  },
  {
    template_key: "price_alert",
    name: "Price Drop Alert",
    description: "Sent when a car's price drops to or below user target",
    icon: Tag,
    subject: "🎉 Price Drop Alert - {{car_name}}",
    body_html: `<h1>Great News! Price Dropped!</h1>
<p>Dear {{customer_name}},</p>
<p>The price for <strong>{{car_name}}</strong> has dropped to or below your target!</p>
<p><strong>Your Target:</strong> {{target_price}}<br/>
<strong>New Price:</strong> {{new_price}}</p>
<p><a href="{{car_link}}">View the car now</a> before it's gone!</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["customer_name", "car_name", "target_price", "new_price", "car_link", "company_name"]
  },
  {
    template_key: "test_drive_reminder",
    name: "Test Drive Reminder",
    description: "Sent as a reminder before scheduled test drive",
    icon: Clock,
    subject: "🔔 Reminder: Your Test Drive Tomorrow - {{car_name}}",
    body_html: `<h1>Test Drive Reminder</h1>
<p>Dear {{customer_name}},</p>
<p>This is a friendly reminder that your test drive for <strong>{{car_name}}</strong> is scheduled for tomorrow!</p>
<p><strong>Date:</strong> {{preferred_date}}<br/>
<strong>Time:</strong> {{preferred_time}}<br/>
<strong>Dealer:</strong> {{dealer_name}}</p>
<p>Please arrive 10 minutes early and bring a valid driver's license.</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["customer_name", "car_name", "preferred_date", "preferred_time", "dealer_name", "company_name"]
  },
  {
    template_key: "dealer_notification",
    name: "New Inquiry for Dealer",
    description: "Sent to dealer when they receive a new test drive inquiry",
    icon: Users,
    subject: "🚗 New Test Drive Inquiry - {{car_name}}",
    body_html: `<h1>New Test Drive Inquiry</h1>
<p>Dear {{dealership_name}},</p>
<p>You have received a new test drive inquiry for <strong>{{car_name}}</strong>.</p>
<p><strong>Customer:</strong> {{customer_name}}<br/>
<strong>Email:</strong> {{customer_email}}<br/>
<strong>Phone:</strong> {{customer_phone}}<br/>
<strong>Preferred Date:</strong> {{preferred_date}}<br/>
<strong>Preferred Time:</strong> {{preferred_time}}</p>
<p>{{message}}</p>
<p>Please log in to your dealer panel to respond to this inquiry.</p>
<p>Best regards,<br/>{{company_name}} Team</p>`,
    variables: ["dealership_name", "car_name", "customer_name", "customer_email", "customer_phone", "preferred_date", "preferred_time", "message", "company_name"]
  }
];

const iconMap: Record<string, React.ElementType> = {
  test_drive_confirmation: Car,
  test_drive_status: Bell,
  dealer_approval: UserCheck,
  subscription_update: ArrowUp,
  price_alert: Tag,
  test_drive_reminder: Clock,
  dealer_notification: Users,
};

const brandingDefaults: Branding = {
  primary_color: "#b8860b",
  secondary_color: "#1a1a1a",
  logo_url: "",
  company_name: "CARBAZAAR",
  footer_text: "This is an automated message from CARBAZAAR. Please do not reply directly to this email.",
  facebook_url: "",
  twitter_url: "",
  instagram_url: ""
};

const AdminEmailTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [branding, setBranding] = useState<Branding>(brandingDefaults);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  
  // Versioning state
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [changeDescription, setChangeDescription] = useState("");
  
  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchBranding();
  }, []);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id && !selectedTemplate.id.startsWith('default-')) {
      fetchVersions(selectedTemplate.id);
    } else {
      setVersions([]);
    }
  }, [selectedTemplate?.id]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");

      if (error) throw error;

      if (data && data.length > 0) {
        const templatesWithIcons = data.map(t => ({
          ...t,
          icon: iconMap[t.template_key] || Mail,
          description: defaultTemplates.find(dt => dt.template_key === t.template_key)?.description || t.description || ""
        }));
        setTemplates(templatesWithIcons);
      } else {
        // Initialize with default templates
        const defaultsWithIds = defaultTemplates.map((t, i) => ({
          ...t,
          id: `default-${i}`
        }));
        setTemplates(defaultsWithIds as EmailTemplate[]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      const defaultsWithIds = defaultTemplates.map((t, i) => ({
        ...t,
        id: `default-${i}`
      }));
      setTemplates(defaultsWithIds as EmailTemplate[]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from("email_branding")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBranding({
          id: data.id,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          logo_url: data.logo_url || "",
          company_name: data.company_name,
          footer_text: data.footer_text,
          facebook_url: data.facebook_url || "",
          twitter_url: data.twitter_url || "",
          instagram_url: data.instagram_url || ""
        });
      }
    } catch (error) {
      console.error("Error fetching branding:", error);
    }
  };

  const fetchVersions = async (templateId: string) => {
    setLoadingVersions(true);
    try {
      const { data, error } = await supabase
        .from("email_template_versions")
        .select("*")
        .eq("template_id", templateId)
        .order("version_number", { ascending: false })
        .limit(10);

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body_html);
    setShowPreview(false);
    setChangeDescription("");
  };

  const saveTemplate = async () => {
    if (!selectedTemplate || !user) return;
    setIsSaving(true);

    try {
      const templateData = {
        template_key: selectedTemplate.template_key,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        subject: editedSubject,
        body_html: editedBody,
        variables: selectedTemplate.variables
      };

      let templateId = selectedTemplate.id;
      const { data: existing } = await supabase
        .from("email_templates")
        .select("id")
        .eq("template_key", selectedTemplate.template_key)
        .single();

      if (existing) {
        templateId = existing.id;
        
        // Save version before updating
        const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
        await supabase
          .from("email_template_versions")
          .insert({
            template_id: existing.id,
            version_number: nextVersion,
            subject: editedSubject,
            body_html: editedBody,
            changed_by: user.id,
            change_description: changeDescription || null
          });

        // Update existing
        const { error } = await supabase
          .from("email_templates")
          .update({
            subject: editedSubject,
            body_html: editedBody
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data: newTemplate, error } = await supabase
          .from("email_templates")
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        if (newTemplate) {
          templateId = newTemplate.id;
          // Save initial version
          await supabase
            .from("email_template_versions")
            .insert({
              template_id: newTemplate.id,
              version_number: 1,
              subject: editedSubject,
              body_html: editedBody,
              changed_by: user.id,
              change_description: "Initial version"
            });
        }
      }

      // Update local state
      setTemplates(prev => prev.map(t =>
        t.template_key === selectedTemplate.template_key
          ? { ...t, id: templateId, subject: editedSubject, body_html: editedBody }
          : t
      ));
      setSelectedTemplate({ ...selectedTemplate, id: templateId, subject: editedSubject, body_html: editedBody });
      setChangeDescription("");

      // Refresh versions
      if (templateId && !templateId.startsWith('default-')) {
        fetchVersions(templateId);
      }

      toast.success("Template saved successfully!");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const rollbackToVersion = (version: TemplateVersion) => {
    setEditedSubject(version.subject);
    setEditedBody(version.body_html);
    setChangeDescription(`Rollback to version ${version.version_number}`);
    toast.info(`Loaded version ${version.version_number}. Click Save to apply.`);
  };

  const resetTemplate = () => {
    const original = defaultTemplates.find(t => t.template_key === selectedTemplate?.template_key);
    if (original) {
      setEditedSubject(original.subject);
      setEditedBody(original.body_html);
      setChangeDescription("Reset to default");
      toast.info("Template reset to default. Click Save to apply.");
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmailAddress) return;
    setSendingTest(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error("Please log in to send test emails");
        return;
      }

      const response = await supabase.functions.invoke("send-test-email", {
        body: {
          templateKey: selectedTemplate.template_key,
          recipientEmail: testEmailAddress,
          subject: editedSubject,
          bodyHtml: editedBody
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send test email");
      }

      toast.success(`Test email sent to ${testEmailAddress}`);
      setShowTestDialog(false);
      setTestEmailAddress("");
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const saveBranding = async () => {
    setIsSavingBranding(true);

    try {
      const brandingData = {
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        logo_url: branding.logo_url || null,
        company_name: branding.company_name,
        footer_text: branding.footer_text,
        facebook_url: branding.facebook_url || null,
        twitter_url: branding.twitter_url || null,
        instagram_url: branding.instagram_url || null
      };

      if (branding.id) {
        const { error } = await supabase
          .from("email_branding")
          .update(brandingData)
          .eq("id", branding.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("email_branding")
          .insert(brandingData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setBranding(prev => ({ ...prev, id: data.id }));
        }
      }

      toast.success("Branding saved successfully!");
    } catch (error) {
      console.error("Error saving branding:", error);
      toast.error("Failed to save branding");
    } finally {
      setIsSavingBranding(false);
    }
  };

  const generatePreview = () => {
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
      next_steps: "You can now log in to your dealer panel and start listing your vehicles.",
      old_plan: "Basic",
      new_plan: "Premium",
      plan_price: "₹3,999/month",
      plan_limit: "Unlimited car listings",
      action: "upgraded",
      emoji: "🎉",
      original_price: "₹45,00,000",
      new_price: "₹42,00,000",
      target_price: "₹43,00,000",
      car_link: "https://carbazaar.com/car/123",
      customer_email: "john.doe@example.com",
      customer_phone: "+91 98765 43210",
      message: "I am interested in this vehicle.",
      company_name: branding.company_name
    };

    let preview = editedBody;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

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
            background: linear-gradient(135deg, ${branding.primary_color}, #daa520); 
            padding: 30px; 
            text-align: center; 
            color: white;
          }
          .header h2 { margin: 0; }
          .content { padding: 30px; }
          .footer { 
            background: ${branding.secondary_color}; 
            padding: 20px; 
            text-align: center; 
            color: #888;
            font-size: 12px;
          }
          h1 { color: #333; }
          a { color: ${branding.primary_color}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚗 ${branding.company_name}</h2>
          </div>
          <div class="content">
            ${preview}
          </div>
          <div class="footer">
            <p>${branding.footer_text}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    setShowPreview(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
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
                        key={template.template_key}
                        onClick={() => selectTemplate(template)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.template_key === template.template_key
                            ? "bg-primary/10 border border-primary"
                            : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 shrink-0 ${selectedTemplate?.template_key === template.template_key ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
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

                    <div>
                      <label className="text-sm font-medium mb-2 block">Change Description (optional)</label>
                      <Input
                        value={changeDescription}
                        onChange={(e) => setChangeDescription(e.target.value)}
                        placeholder="Describe your changes..."
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

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button onClick={generatePreview} variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                      
                      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Send className="w-4 h-4" />
                            Test Email
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Test Email</DialogTitle>
                            <DialogDescription>
                              Send a test email to verify how this template renders
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Recipient Email</label>
                              <Input
                                type="email"
                                value={testEmailAddress}
                                onChange={(e) => setTestEmailAddress(e.target.value)}
                                placeholder="your@email.com"
                              />
                            </div>
                            <Button 
                              onClick={sendTestEmail} 
                              disabled={sendingTest || !testEmailAddress}
                              className="w-full gap-2"
                            >
                              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Send Test Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showVersions} onOpenChange={setShowVersions}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2" disabled={versions.length === 0}>
                            <History className="w-4 h-4" />
                            History ({versions.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Version History</DialogTitle>
                            <DialogDescription>
                              View and rollback to previous versions
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-96 overflow-y-auto space-y-3 py-4">
                            {loadingVersions ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            ) : versions.length === 0 ? (
                              <p className="text-center text-muted-foreground py-4">
                                No version history yet
                              </p>
                            ) : (
                              versions.map((version) => (
                                <div key={version.id} className="p-4 bg-secondary/30 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">v{version.version_number}</Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(version.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        rollbackToVersion(version);
                                        setShowVersions(false);
                                      }}
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Restore
                                    </Button>
                                  </div>
                                  {version.change_description && (
                                    <p className="text-sm text-muted-foreground">{version.change_description}</p>
                                  )}
                                  <p className="text-xs font-mono text-muted-foreground mt-2 truncate">
                                    Subject: {version.subject}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button onClick={resetTemplate} variant="outline" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                      <Button onClick={saveTemplate} className="gap-2" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Template
                      </Button>
                    </div>

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
                      value={branding.company_name}
                      onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        placeholder="#b8860b"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Secondary Color (Footer)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        placeholder="#1a1a1a"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Logo URL</label>
                    <Input
                      value={branding.logo_url}
                      onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Footer Text</label>
                    <Textarea
                      value={branding.footer_text}
                      onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })}
                      rows={3}
                      placeholder="Footer disclaimer text..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Facebook URL</label>
                    <Input
                      value={branding.facebook_url}
                      onChange={(e) => setBranding({ ...branding, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Twitter URL</label>
                    <Input
                      value={branding.twitter_url}
                      onChange={(e) => setBranding({ ...branding, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Instagram URL</label>
                    <Input
                      value={branding.instagram_url}
                      onChange={(e) => setBranding({ ...branding, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={saveBranding} className="gap-2" disabled={isSavingBranding}>
                  {isSavingBranding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Branding
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
