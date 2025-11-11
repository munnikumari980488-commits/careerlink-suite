import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Build email HTML content
    let emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Application Status Update</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Dear ${candidateName},</p>
            <p style="font-size: 16px;">Your application for <strong>${jobTitle}</strong> has been updated.</p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;"><strong>New Status:</strong> ${status}</p>
            </div>
    `;

    if (assignmentName && assignmentLink) {
      emailContent += `
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Assignment Details</h3>
              <p style="margin: 10px 0;"><strong>Assignment:</strong> ${assignmentName}</p>
              <p style="margin: 10px 0;">
                <a href="${assignmentLink}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${assignmentLink}</a>
              </p>
              <p style="margin: 10px 0; color: #92400e;">Please complete the assignment and submit it through the provided link.</p>
            </div>
      `;
    }

    emailContent += `
            <p style="margin-top: 30px; font-size: 16px;">Best regards,<br><strong>The Hiring Team</strong></p>
          </div>
        </body>
      </html>
    `;

    // Use Deno's built-in fetch to call an SMTP API service
    // Since SMTP libraries have issues, we'll use a simple workaround with raw SMTP protocol
    const smtpHost = Deno.env.get("SMTP_HOST")!;
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER")!;
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
    const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL")!;

    // Connect to SMTP server using raw TCP
    const conn = await Deno.connect({ hostname: smtpHost, port: smtpPort });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Helper function to read response
    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buffer.subarray(0, n));
    };

    // Helper function to send command
    const sendCommand = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    try {
      // SMTP handshake
      await readResponse(); // Read welcome message
      await sendCommand(`EHLO ${smtpHost}`);
      await sendCommand("STARTTLS");
      
      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
      
      // Auth
      await tlsConn.write(encoder.encode(`EHLO ${smtpHost}\r\n`));
      await readResponse();
      
      await tlsConn.write(encoder.encode("AUTH LOGIN\r\n"));
      await readResponse();
      
      await tlsConn.write(encoder.encode(btoa(smtpUser) + "\r\n"));
      await readResponse();
      
      await tlsConn.write(encoder.encode(btoa(smtpPassword) + "\r\n"));
      await readResponse();
      
      // Send email
      await tlsConn.write(encoder.encode(`MAIL FROM:<${smtpFrom}>\r\n`));
      await readResponse();
      
      await tlsConn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
      await readResponse();
      
      await tlsConn.write(encoder.encode("DATA\r\n"));
      await readResponse();
      
      const emailData = `From: ${smtpFrom}\r\nTo: ${to}\r\nSubject: Application Update - ${jobTitle}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${emailContent}\r\n.\r\n`;
      await tlsConn.write(encoder.encode(emailData));
      await readResponse();
      
      await tlsConn.write(encoder.encode("QUIT\r\n"));
      tlsConn.close();
      
      console.log("Email sent successfully to:", to);

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (smtpError) {
      conn.close();
      throw smtpError;
    }
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
