import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const notificationSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  carName: z.string().min(1).max(200).trim(),
  oldStatus: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  newStatus: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  preferredTime: z.string().min(1).max(50).trim()
});

// HTML escape function to prevent XSS in emails
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error("Role check failed:", roleError.message);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!roleData) {
      console.error("User does not have admin role:", user.id);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = notificationSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.format());
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.format() 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const { email, name, carName, oldStatus, newStatus, preferredDate, preferredTime } = validationResult.data;

    // Escape HTML in user-provided values for email template
    const safeName = escapeHtml(name);
    const safeCarName = escapeHtml(carName);
    const safePreferredDate = escapeHtml(preferredDate);
    const safePreferredTime = escapeHtml(preferredTime);

    console.log(`Sending notification to ${email} for car ${safeCarName}, status changed from ${oldStatus} to ${newStatus}`);

    const statusEmoji = newStatus === 'confirmed' ? '✅' : newStatus === 'cancelled' ? '❌' : '📋';
    const statusMessage = newStatus === 'confirmed' 
      ? 'Your test drive has been confirmed!' 
      : newStatus === 'cancelled' 
        ? 'Your test drive has been cancelled.' 
        : `Your test drive status has been updated to: ${escapeHtml(newStatus)}`;

    const emailResponse = await resend.emails.send({
      from: "Car Dealership <onboarding@resend.dev>",
      to: [email],
      subject: `${statusEmoji} Test Drive Update - ${safeCarName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #b8860b, #daa520); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .confirmed { background: #dcfce7; color: #166534; }
            .cancelled { background: #fee2e2; color: #dc2626; }
            .pending { background: #fef3c7; color: #92400e; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details p { margin: 8px 0; color: #333; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Test Drive Update</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>${statusMessage}</p>
              
              <div class="status-badge ${newStatus}">
                Status: ${escapeHtml(newStatus.charAt(0).toUpperCase() + newStatus.slice(1))}
              </div>
              
              <div class="details">
                <p><strong>Vehicle:</strong> ${safeCarName}</p>
                <p><strong>Scheduled Date:</strong> ${safePreferredDate}</p>
                <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
              </div>
              
              ${newStatus === 'confirmed' ? `
                <p>Please arrive 10 minutes before your scheduled time. Don't forget to bring:</p>
                <ul>
                  <li>Valid driving license</li>
                  <li>Government-issued ID</li>
                </ul>
              ` : ''}
              
              <p>If you have any questions, please contact our dealership.</p>
              
              <div class="footer">
                <p>Thank you for choosing our dealership!</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-test-drive-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending the notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
