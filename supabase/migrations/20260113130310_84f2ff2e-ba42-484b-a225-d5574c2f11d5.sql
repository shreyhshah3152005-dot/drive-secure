-- Create subscription upgrade requests table
CREATE TABLE public.subscription_upgrade_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
    current_plan TEXT NOT NULL,
    requested_plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Dealers can view their own upgrade requests"
ON public.subscription_upgrade_requests
FOR SELECT
USING (dealer_id = get_dealer_id(auth.uid()));

CREATE POLICY "Dealers can create upgrade requests"
ON public.subscription_upgrade_requests
FOR INSERT
WITH CHECK (dealer_id = get_dealer_id(auth.uid()));

CREATE POLICY "Admins can view all upgrade requests"
ON public.subscription_upgrade_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update upgrade requests"
ON public.subscription_upgrade_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_upgrade_requests_updated_at
BEFORE UPDATE ON public.subscription_upgrade_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();