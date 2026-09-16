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
            <a href="${(process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) ? process.env.NEXTAUTH_URL : "https://casadosete.vercel.app"}/gestao/produtos"
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
            <a href="${(process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) ? process.env.NEXTAUTH_URL : "https://casadosete.vercel.app"}/gestao/produtos"
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

/**
 * Send password reset email to a customer
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetUrl: string
) {
  try {
    await transporter.sendMail({
      from: `"Casa do 7" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Recuperação de Senha — Casa do 7`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #faf8f5; border-radius: 16px; border: 1px solid #e8e2d8;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #262626; font-size: 24px; margin: 0; font-weight: 700;">Casa do 7</h1>
            <p style="color: #b8860b; font-size: 13px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Artigos Religiosos</p>
          </div>
          <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #efeae1; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h2 style="color: #262626; font-size: 18px; margin: 0 0 12px;">
              Olá, ${userName || "cliente"}!
            </h2>
            <p style="color: #595959; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Casa do 7</strong>. Se você realizou essa solicitação, clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; padding: 12px 32px; background: #c8912a; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(200, 145, 42, 0.3);">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="color: #8c8c8c; font-size: 12px; line-height: 1.5; margin: 0;">
              Este link é válido por <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, nenhuma ação é necessária — sua senha atual permanecerá segura.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a8a29e; font-size: 11px; margin: 0;">
              Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:<br/>
              <a href="${resetUrl}" style="color: #c8912a; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[NOTIFICATION] Password reset email sent to "${toEmail}"`);
    return true;
  } catch (error) {
    console.error("[NOTIFICATION] Failed to send password reset email:", error);
    return false;
  }
}

