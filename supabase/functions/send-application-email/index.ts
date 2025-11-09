import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST")!,
        port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASSWORD")!,
        },
      },
    });

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

    await client.send({
      from: Deno.env.get("SMTP_FROM_EMAIL")!,
      to: to,
      subject: `Application Update - ${jobTitle}`,
      content: emailContent,
      html: emailContent,
    });

    await client.close();

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
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
