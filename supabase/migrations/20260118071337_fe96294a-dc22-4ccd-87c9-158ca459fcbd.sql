-- Create email_templates table for storing customized email templates
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  body_html text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create email_branding table for storing email branding settings
CREATE TABLE public.email_branding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color text NOT NULL DEFAULT '#b8860b',
  secondary_color text NOT NULL DEFAULT '#1a1a1a',
  logo_url text,
  company_name text NOT NULL DEFAULT 'CARBAZAAR',
  footer_text text NOT NULL DEFAULT 'This is an automated message from CARBAZAAR. Please do not reply directly to this email.',
  facebook_url text,
  twitter_url text,
  instagram_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_branding ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates (admin only)
CREATE POLICY "Admins can view email templates"
ON public.email_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete email templates"
ON public.email_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for email_branding (admin only)
CREATE POLICY "Admins can view email branding"
ON public.email_branding
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email branding"
ON public.email_branding
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email branding"
ON public.email_branding
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete email branding"
ON public.email_branding
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_branding_updated_at
BEFORE UPDATE ON public.email_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default branding row
INSERT INTO public.email_branding (primary_color, secondary_color, company_name)
VALUES ('#b8860b', '#1a1a1a', 'CARBAZAAR');