import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  candidateName: string;
  jobTitle: string;
  status: string;
  assignmentName?: string;
  assignmentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, candidateName, jobTitle, status, assignmentName, assignmentLink }: EmailRequest = await req.json();

    console.log("Sending email to:", to);

    if (!to) {
      console.error("Recipient email is missing");
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    let emailContent = `
      <h2>Application Status Update</h2>
      <p>Dear ${candidateName},</p>
      <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
      <p><strong>New Status:</strong> ${status}</p>
    `;

    if (assignmentName && assignmentLink) {
      emailContent += `
        <h3>Assignment Details</h3>
        <p><strong>Assignment:</strong> ${assignmentName}</p>
        <p><strong>Link:</strong> <a href="${assignmentLink}">${assignmentLink}</a></p>
        <p>Please complete the assignment and submit it through the provided link.</p>
      `;
    }

    emailContent += `
      <p>Best regards,<br>The Hiring Team</p>
    `;

    const { data, error } = await resend.emails.send({
      from: "Application Updates <onboarding@resend.dev>",
      to: [to],
      subject: `Application Update - ${jobTitle}`,
      html: emailContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
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
