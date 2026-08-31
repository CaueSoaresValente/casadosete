import nodemailer from "nodemailer";

// ============================================
// E-mail Notification (Gmail SMTP)
// ============================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send a low-stock alert email to the admin
 */
export async function sendLowStockEmail(
  productName: string,
  currentStock: number,
  stockUnit: string
) {
  const unitLabel = stockUnit === "kg" ? "kg" : "unidade(s)";

  try {
    await transporter.sendMail({
      from: `"Casa do 7 — Alerta de Estoque" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `⚠️ Estoque baixo: ${productName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #fdf8ed; border-radius: 12px; border: 1px solid #f3d894;">
          <div style="text-align: center; margin-bottom: 16px;">
            <span style="font-size: 40px;">⚠️</span>
          </div>
          <h2 style="color: #5c3f18; font-size: 20px; text-align: center; margin: 0 0 8px;">
            Alerta de Estoque Baixo
          </h2>
          <p style="color: #7d551d; text-align: center; font-size: 14px; margin: 0 0 20px;">
            O estoque de um produto está chegando ao fim.
          </p>
          <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #f3d894;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #404040;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #7d551d;">Produto:</td>
                <td style="padding: 8px 0; text-align: right;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #7d551d;">Estoque atual:</td>
                <td style="padding: 8px 0; text-align: right; color: #b91c1c; font-weight: bold;">
                  ${currentStock} ${unitLabel}
                </td>
              </tr>
            </table>
          </div>
          <p style="color: #a47322; font-size: 12px; text-align: center; margin-top: 16px;">
            Acesse o painel administrativo para repor o estoque.
          </p>
          <div style="text-align: center; margin-top: 12px;">
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/gestao/produtos"
               style="display: inline-block; padding: 10px 24px; background: #c8912a; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
              Ir para o Painel →
            </a>
          </div>
        </div>
      `,
    });
    console.log(`[NOTIFICATION] Low stock email sent for "${productName}"`);
  } catch (error) {
    console.error("[NOTIFICATION] Failed to send low stock email:", error);
  }
}

/**
 * Send an out-of-stock alert email to the admin
 */
export async function sendOutOfStockEmail(productName: string) {
  try {
    await transporter.sendMail({
      from: `"Casa do 7 — Alerta de Estoque" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🚨 ESGOTADO: ${productName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #fef2f2; border-radius: 12px; border: 1px solid #fca5a5;">
          <div style="text-align: center; margin-bottom: 16px;">
            <span style="font-size: 40px;">🚨</span>
          </div>
          <h2 style="color: #991b1b; font-size: 20px; text-align: center; margin: 0 0 8px;">
            Produto Esgotado!
          </h2>
          <p style="color: #b91c1c; text-align: center; font-size: 14px; margin: 0 0 20px;">
            O produto <strong>"${productName}"</strong> acabou de zerar no estoque. Ele será exibido como indisponível na loja.
          </p>
          <div style="text-align: center; margin-top: 12px;">
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/gestao/produtos"
               style="display: inline-block; padding: 10px 24px; background: #b91c1c; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
              Repor estoque agora →
            </a>
          </div>
        </div>
      `,
    });
    console.log(`[NOTIFICATION] Out-of-stock email sent for "${productName}"`);
  } catch (error) {
    console.error("[NOTIFICATION] Failed to send out-of-stock email:", error);
  }
}

/**
 * Check stock level and send appropriate notification if needed.
 * Call this after any stock decrement operation.
 */
export function checkAndNotifyStock(
  productName: string,
  currentStock: number,
  stockUnit: string,
  lowStockThreshold: number
) {
  // Fire-and-forget — don't block the main operation
  if (currentStock === 0) {
    sendOutOfStockEmail(productName).catch(() => {});
  } else if (currentStock <= lowStockThreshold) {
    sendLowStockEmail(productName, currentStock, stockUnit).catch(() => {});
  }
}
