-- Create email_template_versions table for version history
CREATE TABLE public.email_template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  subject text NOT NULL,
  body_html text NOT NULL,
  changed_by uuid NOT NULL,
  change_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email_template_versions
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;

-- Admins can view email template versions
CREATE POLICY "Admins can view email template versions"
ON public.email_template_versions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert email template versions
CREATE POLICY "Admins can insert email template versions"
ON public.email_template_versions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete email template versions
CREATE POLICY "Admins can delete email template versions"
ON public.email_template_versions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for better performance
CREATE INDEX idx_email_template_versions_template_id ON public.email_template_versions(template_id);
CREATE INDEX idx_email_template_versions_version ON public.email_template_versions(template_id, version_number DESC);

-- Insert default email templates if none exist
INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'test_drive_confirmation', 'Test Drive Confirmation', 'Sent when a customer submits a test drive request',
  '🚗 Test Drive Request Confirmed - {{car_name}}',
  '<h1>Thank you for your test drive request!</h1>
<p>Dear {{customer_name}},</p>
<p>We have received your test drive request for <strong>{{car_name}}</strong>.</p>
<p><strong>Requested Date:</strong> {{preferred_date}}<br/>
<strong>Requested Time:</strong> {{preferred_time}}</p>
<p>The dealer will contact you shortly to confirm the appointment.</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['customer_name', 'car_name', 'preferred_date', 'preferred_time', 'dealer_name', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'test_drive_confirmation');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'test_drive_status', 'Test Drive Status Update', 'Sent when test drive status is updated by admin',
  '📋 Test Drive Status Update - {{car_name}}',
  '<h1>Test Drive Status Updated</h1>
<p>Dear {{customer_name}},</p>
<p>Your test drive request for <strong>{{car_name}}</strong> has been updated.</p>
<p><strong>Previous Status:</strong> {{old_status}}<br/>
<strong>New Status:</strong> {{new_status}}</p>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['customer_name', 'car_name', 'old_status', 'new_status', 'preferred_date', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'test_drive_status');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'dealer_approval', 'Dealer Approval/Rejection', 'Sent when a dealer application is approved or rejected',
  '{{status_emoji}} Dealer Registration {{status}} - {{company_name}}',
  '<h1>Dealer Registration {{status}}</h1>
<p>Dear {{dealership_name}},</p>
<p>{{status_message}}</p>
<p>{{next_steps}}</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['dealership_name', 'status', 'status_emoji', 'status_message', 'next_steps', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'dealer_approval');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'subscription_update', 'Subscription Plan Update', 'Sent when a dealer subscription plan is changed',
  '{{emoji}} Your Subscription Plan Has Been {{action}}',
  '<h1>Subscription Update</h1>
<p>Dear {{dealership_name}},</p>
<p>Your subscription plan has been {{action}}.</p>
<p><strong>Previous Plan:</strong> {{old_plan}}<br/>
<strong>New Plan:</strong> {{new_plan}}<br/>
<strong>Price:</strong> {{plan_price}}<br/>
<strong>Listing Limit:</strong> {{plan_limit}}</p>
<p>Log in to your dealer panel to take advantage of your updated plan.</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['dealership_name', 'old_plan', 'new_plan', 'plan_price', 'plan_limit', 'action', 'emoji', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'subscription_update');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'price_alert', 'Price Drop Alert', 'Sent when a car price drops to or below user target',
  '🎉 Price Drop Alert - {{car_name}}',
  '<h1>Great News! Price Dropped!</h1>
<p>Dear {{customer_name}},</p>
<p>The price for <strong>{{car_name}}</strong> has dropped to or below your target!</p>
<p><strong>Your Target:</strong> {{target_price}}<br/>
<strong>New Price:</strong> {{new_price}}</p>
<p><a href="{{car_link}}">View the car now</a> before it''s gone!</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['customer_name', 'car_name', 'target_price', 'new_price', 'car_link', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'price_alert');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'test_drive_reminder', 'Test Drive Reminder', 'Sent as a reminder before scheduled test drive',
  '🔔 Reminder: Your Test Drive Tomorrow - {{car_name}}',
  '<h1>Test Drive Reminder</h1>
<p>Dear {{customer_name}},</p>
<p>This is a friendly reminder that your test drive for <strong>{{car_name}}</strong> is scheduled for tomorrow!</p>
<p><strong>Date:</strong> {{preferred_date}}<br/>
<strong>Time:</strong> {{preferred_time}}<br/>
<strong>Dealer:</strong> {{dealer_name}}</p>
<p>Please arrive 10 minutes early and bring a valid driver''s license.</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['customer_name', 'car_name', 'preferred_date', 'preferred_time', 'dealer_name', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'test_drive_reminder');

INSERT INTO public.email_templates (template_key, name, description, subject, body_html, variables)
SELECT 'dealer_notification', 'New Inquiry for Dealer', 'Sent to dealer when they receive a new test drive inquiry',
  '🚗 New Test Drive Inquiry - {{car_name}}',
  '<h1>New Test Drive Inquiry</h1>
<p>Dear {{dealership_name}},</p>
<p>You have received a new test drive inquiry for <strong>{{car_name}}</strong>.</p>
<p><strong>Customer:</strong> {{customer_name}}<br/>
<strong>Email:</strong> {{customer_email}}<br/>
<strong>Phone:</strong> {{customer_phone}}<br/>
<strong>Preferred Date:</strong> {{preferred_date}}<br/>
<strong>Preferred Time:</strong> {{preferred_time}}</p>
<p>{{message}}</p>
<p>Please log in to your dealer panel to respond to this inquiry.</p>
<p>Best regards,<br/>{{company_name}} Team</p>',
  ARRAY['dealership_name', 'car_name', 'customer_name', 'customer_email', 'customer_phone', 'preferred_date', 'preferred_time', 'message', 'company_name']
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'dealer_notification');