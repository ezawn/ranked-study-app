import "server-only";

import { env } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/brand";

/**
 * Sending email.
 *
 * There is no provider wired up, and rather than pretend otherwise the default
 * transport prints the message to the server console. That means password
 * reset works end to end in development — you copy the link out of your
 * terminal — without anyone having to sign up for anything first.
 *
 * To send for real, set RESEND_API_KEY and MAIL_FROM. The Resend transport
 * below uses their HTTP API, so there is no dependency to install.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface MailResult {
  delivered: boolean;
  /** True when the message went to the console rather than to an inbox. */
  logged: boolean;
}

async function sendViaResend(mail: Mail): Promise<MailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.mail.resendKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.mail.from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the message (${response.status}): ${detail.slice(0, 300)}`);
  }

  return { delivered: true, logged: false };
}

function sendToConsole(mail: Mail): MailResult {
  console.log(
    [
      "",
      "─".repeat(72),
      "  EMAIL (no provider configured — printed instead of sent)",
      "─".repeat(72),
      `  To:      ${mail.to}`,
      `  Subject: ${mail.subject}`,
      "",
      mail.text
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n"),
      "─".repeat(72),
      "",
    ].join("\n"),
  );

  return { delivered: true, logged: true };
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  if (!env.mail.configured) return sendToConsole(mail);

  try {
    return await sendViaResend(mail);
  } catch (error) {
    // Falling back to the console keeps the flow usable rather than losing the
    // link entirely, and the error is loud enough to notice.
    console.error("[mail] send failed, printing instead", error);
    return sendToConsole(mail);
  }
}

export function passwordResetEmail(name: string | null, link: string): Omit<Mail, "to"> {
  return {
    subject: `Reset your ${PRODUCT_NAME} password`,
    text: [
      `Hi${name ? ` ${name}` : ""},`,
      "",
      `Someone asked to reset the password on your ${PRODUCT_NAME} account.`,
      "If that was you, open this link within the next hour:",
      "",
      link,
      "",
      "If it wasn't you, you can ignore this — your password hasn't changed and",
      "the link will expire on its own.",
      "",
      `— ${PRODUCT_NAME}`,
    ].join("\n"),
  };
}
