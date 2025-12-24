import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  carName: string;
  oldStatus: string;
  newStatus: string;
  preferredDate: string;
  preferredTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, carName, oldStatus, newStatus, preferredDate, preferredTime }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${email} for car ${carName}, status changed from ${oldStatus} to ${newStatus}`);

    const statusEmoji = newStatus === 'confirmed' ? '✅' : newStatus === 'cancelled' ? '❌' : '📋';
    const statusMessage = newStatus === 'confirmed' 
      ? 'Your test drive has been confirmed!' 
      : newStatus === 'cancelled' 
        ? 'Your test drive has been cancelled.' 
        : `Your test drive status has been updated to: ${newStatus}`;

    const emailResponse = await resend.emails.send({
      from: "Car Dealership <onboarding@resend.dev>",
      to: [email],
      subject: `${statusEmoji} Test Drive Update - ${carName}`,
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
              <p>Hello <strong>${name}</strong>,</p>
              <p>${statusMessage}</p>
              
              <div class="status-badge ${newStatus}">
                Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
              </div>
              
              <div class="details">
                <p><strong>Vehicle:</strong> ${carName}</p>
                <p><strong>Scheduled Date:</strong> ${preferredDate}</p>
                <p><strong>Preferred Time:</strong> ${preferredTime}</p>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
