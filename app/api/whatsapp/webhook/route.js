import { NextResponse } from "next/server";
import { saveWhatsAppMessage } from "@/lib/whatsapp-chat-store";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "haruviru_whatsapp_token_2026";

/**
 * GET Verification endpoint for Meta WhatsApp Business Cloud Webhook
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ [WhatsApp Webhook Verified Successfully]");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden: Invalid verification token", { status: 403 });
    }
  }

  return new Response("Bad Request", { status: 400 });
}

/**
 * POST Webhook endpoint for receiving real-time customer replies & status updates
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // Check for test customer reply simulation trigger from client
    if (body.simulateReply) {
      const { phone, customerName, message } = body;
      if (phone && message) {
        const saved = saveWhatsAppMessage({
          phone,
          sender: "CUSTOMER",
          senderName: customerName || "Customer",
          message,
          status: "RECEIVED",
        });
        return NextResponse.json({ success: true, message: saved });
      }
    }

    // Process Meta WhatsApp Cloud API incoming webhook payload structure
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value;
            if (value && value.messages && Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                const fromPhone = msg.from; // Customer phone e.g. 919762486649
                const metaId = msg.id;
                let textContent = "";

                if (msg.type === "text" && msg.text?.body) {
                  textContent = msg.text.body;
                } else if (msg.type === "button" && msg.button?.text) {
                  textContent = `[Button Click]: ${msg.button.text}`;
                } else if (msg.type === "interactive" && msg.interactive?.button_reply?.title) {
                  textContent = `[Interactive Choice]: ${msg.interactive.button_reply.title}`;
                } else {
                  textContent = `[${msg.type || "Media"} Message Received]`;
                }

                const contactName =
                  value.contacts && value.contacts[0]?.profile?.name
                    ? value.contacts[0].profile.name
                    : "Customer";

                console.log(`📩 [WhatsApp Webhook Received Reply] From: ${contactName} (+${fromPhone}): "${textContent}"`);

                saveWhatsAppMessage({
                  phone: fromPhone,
                  sender: "CUSTOMER",
                  senderName: contactName,
                  message: textContent,
                  status: "RECEIVED",
                  metaId,
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (err) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
