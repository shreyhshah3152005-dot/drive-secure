import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema for approval notification
const approvalSchema = z.object({
  dealerId: z.string().uuid(),
  action: z.enum(["approved", "declined"]),
  dealershipName: z.string().min(1).max(200),
});

// Escape HTML to prevent XSS
const escapeHtml = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Create client with auth context to verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = approvalSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validationResult.error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { dealerId, action, dealershipName } = validationResult.data;

    // Get dealer information including user email
    const { data: dealer, error: dealerError } = await supabase
      .from("dealers")
      .select("user_id")
      .eq("id", dealerId)
      .single();

    if (dealerError || !dealer) {
      return new Response(
        JSON.stringify({ error: "Dealer not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(dealer.user_id);

    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Dealer email not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const dealerEmail = userData.user.email;
    const escapedDealershipName = escapeHtml(dealershipName);

    // Prepare email content based on action
    const isApproved = action === "approved";
    const subject = isApproved
      ? `🎉 Your Dealer Account Has Been Approved - ${escapedDealershipName}`
      : `Account Update for ${escapedDealershipName}`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          </div>
          <div style="background: #1a1a2e; padding: 30px; color: #fff; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Dear <strong>${escapedDealershipName}</strong> Team,</p>
            <p style="line-height: 1.6; margin-bottom: 20px;">
              Great news! Your dealer account on <strong style="color: #d4af37;">CarBazaar</strong> has been approved by our admin team.
            </p>
            <p style="line-height: 1.6; margin-bottom: 20px;">
              You can now sign in to the Dealer Portal and start listing your cars!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${supabaseUrl.replace('.supabase.co', '')}/dealer-auth" 
                 style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Sign In to Dealer Portal
              </a>
            </div>
            <p style="line-height: 1.6; color: #888;">
              Thank you for choosing CarBazaar as your platform for reaching car buyers.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© 2026 CarBazaar. All rights reserved.</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Account Update</h1>
          </div>
          <div style="background: #1a1a2e; padding: 30px; color: #fff; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Dear <strong>${escapedDealershipName}</strong> Team,</p>
            <p style="line-height: 1.6; margin-bottom: 20px;">
              We regret to inform you that your dealer registration on <strong style="color: #d4af37;">CarBazaar</strong> was not approved at this time.
            </p>
            <p style="line-height: 1.6; margin-bottom: 20px;">
              This could be due to incomplete information or verification issues. If you believe this was a mistake, please contact our support team.
            </p>
            <p style="line-height: 1.6; color: #888;">
              Thank you for your interest in CarBazaar.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© 2026 CarBazaar. All rights reserved.</p>
          </div>
        </div>
      `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CarBazaar <onboarding@resend.dev>",
      to: [dealerEmail],
      subject,
      html: htmlContent,
    });

    console.log("Dealer approval notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-dealer-approval-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);