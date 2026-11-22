let nodemailer;
try {
    nodemailer = require("nodemailer");
} catch (error) {
    nodemailer = null;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character]));
}

async function sendInvoiceEmail(invoice) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!nodemailer) {
        return {
            sent: false,
            reason: "Install the email dependency with: npm install nodemailer"
        };
    }

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        return {
            sent: false,
            reason: "Configure SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in backend/.env."
        };
    }

    if (!invoice.email) {
        return { sent: false, reason: "Customer email address is missing." };
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    const rows = (invoice.items || []).map(item => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const subtotal = Number(item.subtotal ?? qty * price);
        return `<tr>
            <td style="padding:12px;border-bottom:1px solid #eee">${escapeHtml(item.title)}</td>
            <td style="padding:12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
            <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">₹${price.toFixed(2)}</td>
            <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">₹${subtotal.toFixed(2)}</td>
        </tr>`;
    }).join("");

    const html = `
    <div style="margin:0;background:#f7f3fc;padding:28px;font-family:Arial,sans-serif;color:#241333">
      <div style="max-width:680px;margin:auto;background:#fff;border-radius:14px;overflow:hidden">
        <div style="padding:26px 30px;background:#28103f;color:#fff">
          <div style="font-size:28px;font-weight:800;letter-spacing:2px">NOVA<span style="color:#c58cff">.</span></div>
          <p style="margin:8px 0 0;color:#e2d1f2">Thank you for your purchase!</p>
        </div>
        <div style="padding:30px">
          <h2 style="margin:0 0 8px">Your payment is confirmed</h2>
          <p style="color:#776b80;line-height:1.6">Hi ${escapeHtml(invoice.customerName || "Customer")}, your NOVA invoice is ready.</p>
          <p style="line-height:1.8;font-size:13px">
            <b>Invoice:</b> ${escapeHtml(invoice.invoiceNumber)}<br>
            <b>Order ID:</b> ${escapeHtml(invoice.orderId)}<br>
            <b>Payment:</b> ${escapeHtml(String(invoice.paymentMethod || "").toUpperCase())} — PAID
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f3eaff;text-align:left">
              <th style="padding:12px">Product</th><th style="padding:12px">Qty</th>
              <th style="padding:12px;text-align:right">Price</th><th style="padding:12px;text-align:right">Amount</th>
            </tr></thead><tbody>${rows}</tbody>
          </table>
          <div style="margin-top:22px;text-align:right;font-size:21px;font-weight:800;color:#7628d7">
            Total: ₹${Number(invoice.totalAmount || 0).toFixed(2)}
          </div>
          <p style="margin-top:28px;color:#8d8299;font-size:12px;line-height:1.6">
            This is an automatically generated invoice from NOVA Online Shopping. Please keep this email for your records.
          </p>
        </div>
      </div>
    </div>`;

    await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: invoice.email,
        subject: `NOVA Invoice ${invoice.invoiceNumber} – Payment Confirmed`,
        html
    });

    return { sent: true, to: invoice.email };
}

module.exports = { sendInvoiceEmail };
