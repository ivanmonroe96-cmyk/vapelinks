export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Default sender — uses Resend's onboarding domain until custom domain is verified
const FROM_EMAIL = 'Vapelink Australia <onboarding@resend.dev>';
const ADMIN_EMAIL = 'info@vapelink.com.au';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Missing type or data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;

    switch (type) {
      case 'admin-order': {
        // Admin notification for new orders
        const itemsHtml = (data.items || [])
          .map((item: any) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${item.title}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty || 1}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(parseFloat(item.price || '0') * (item.qty || 1)).toFixed(2)}</td></tr>`)
          .join('');

        result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: `🛒 New Order ${data.orderNumber} — $${data.total} AUD (${data.paymentMethod})`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
              <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px;border-radius:12px 12px 0 0;">
                <h1 style="color:white;font-size:20px;margin:0;">New Order Received</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">${data.orderNumber} · ${new Date(data.date).toLocaleString('en-AU')}</p>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <h2 style="font-size:15px;color:#16a34a;margin:0 0 12px;">Customer Details</h2>
                <table style="font-size:14px;width:100%;border-collapse:collapse;">
                  <tr><td style="padding:4px 0;color:#64748b;">Name</td><td style="padding:4px 0;font-weight:600;">${data.firstName} ${data.lastName}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Email</td><td style="padding:4px 0;">${data.email}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Phone</td><td style="padding:4px 0;">${data.phone || 'Not provided'}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Address</td><td style="padding:4px 0;">${[data.address, data.address2, data.city, data.state, data.postcode, 'Australia'].filter(Boolean).join(', ')}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <h2 style="font-size:15px;color:#16a34a;margin:0 0 12px;">Order Items</h2>
                <table style="font-size:14px;width:100%;border-collapse:collapse;">
                  <thead><tr style="background:#f8fafc;"><th style="padding:8px 12px;text-align:left;">Product</th><th style="padding:8px 12px;text-align:center;">Qty</th><th style="padding:8px 12px;text-align:right;">Total</th></tr></thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid rgba(22,163,74,0.2);">
                  <table style="font-size:14px;width:100%;">
                    <tr><td style="color:#64748b;">Subtotal</td><td style="text-align:right;">$${data.subtotal}</td></tr>
                    <tr><td style="color:#64748b;">Shipping (${data.shippingMethod || 'Standard'})</td><td style="text-align:right;">${data.shippingCost === 0 || data.shippingCost === '0' ? 'FREE' : '$' + data.shippingCost}</td></tr>
                    <tr><td style="font-weight:700;font-size:16px;padding-top:8px;">Total</td><td style="text-align:right;font-weight:700;font-size:16px;color:#16a34a;padding-top:8px;">$${data.total} AUD</td></tr>
                  </table>
                </div>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <table style="font-size:14px;width:100%;">
                  <tr><td style="color:#64748b;">Payment</td><td style="font-weight:600;">${data.paymentMethod}</td></tr>
                  <tr><td style="color:#64748b;">Status</td><td style="font-weight:600;color:#f59e0b;">${data.status || 'Pending'}</td></tr>
                  ${data.btcAmount ? `<tr><td style="color:#64748b;">BTC Amount</td><td style="font-weight:600;">${data.btcAmount}</td></tr>` : ''}
                  ${data.txId ? `<tr><td style="color:#64748b;">TX ID</td><td style="font-size:12px;word-break:break-all;">${data.txId}</td></tr>` : ''}
                  ${data.notes ? `<tr><td style="color:#64748b;">Notes</td><td>${data.notes}</td></tr>` : ''}
                </table>
              </div>
              <div style="padding:16px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                Vapelink Australia · vapelink.com.au
              </div>
            </div>
          `,
        });
        break;
      }

      case 'customer-confirmation': {
        // Customer order confirmation email
        const custItemsHtml = (data.items || [])
          .map((item: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.title}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty || 1}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(parseFloat(item.price || '0') * (item.qty || 1)).toFixed(2)}</td></tr>`)
          .join('');

        result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [data.email],
          subject: `Order Confirmation — ${data.orderNumber} | Vapelink Australia`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
              <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;font-size:22px;margin:0;">Thanks for your order, ${data.firstName}!</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Order ${data.orderNumber}</p>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <p style="font-size:14px;color:#475569;line-height:1.6;">We've received your order and will begin processing it shortly. Here's a summary of what you ordered:</p>
                <table style="font-size:14px;width:100%;border-collapse:collapse;margin-top:16px;">
                  <thead><tr style="background:#f8fafc;"><th style="padding:8px 12px;text-align:left;">Product</th><th style="padding:8px 12px;text-align:center;">Qty</th><th style="padding:8px 12px;text-align:right;">Total</th></tr></thead>
                  <tbody>${custItemsHtml}</tbody>
                </table>
                <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid rgba(22,163,74,0.2);">
                  <table style="font-size:14px;width:100%;">
                    <tr><td>Shipping (${data.shippingMethod || 'Standard'})</td><td style="text-align:right;">${data.shippingCost === 0 || data.shippingCost === '0' ? 'FREE' : '$' + data.shippingCost}</td></tr>
                    <tr><td style="font-weight:700;font-size:16px;padding-top:8px;">Total</td><td style="text-align:right;font-weight:700;font-size:16px;color:#16a34a;padding-top:8px;">$${data.total} AUD</td></tr>
                  </table>
                </div>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
                <h2 style="font-size:15px;margin:0 0 8px;">Payment: ${data.paymentMethod}</h2>
                ${data.paymentMethod === 'Bitcoin (BTC)' ? `<p style="font-size:14px;color:#475569;">BTC Amount: <strong>${data.btcAmount || 'See order confirmation page'}</strong></p>${data.txId ? `<p style="font-size:13px;color:#475569;">Transaction: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;word-break:break-all;">${data.txId}</code></p>` : ''}` : ''}
                ${data.paymentMethod === 'Bank Transfer' || data.paymentMethod === 'PayID' ? `<p style="font-size:14px;color:#475569;">We'll send you payment details shortly. Please use <strong>${data.orderNumber}</strong> as your payment reference.</p>` : ''}
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
                <h2 style="font-size:15px;margin:0 0 8px;">Shipping to</h2>
                <p style="font-size:14px;color:#475569;margin:0;">${data.firstName} ${data.lastName}<br/>${[data.address, data.address2, data.city, `${data.state} ${data.postcode}`, 'Australia'].filter(Boolean).join(', ')}</p>
              </div>
              <div style="padding:20px;text-align:center;background:#f8fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                <p style="font-size:13px;color:#64748b;margin:0;">Need help? Email us at <a href="mailto:info@vapelink.com.au" style="color:#16a34a;">info@vapelink.com.au</a></p>
                <p style="font-size:12px;color:#94a3b8;margin:8px 0 0;">Vapelink Australia · vapelink.com.au</p>
              </div>
            </div>
          `,
        });
        break;
      }

      case 'contact': {
        // Contact form message — sends to admin
        result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          replyTo: data.email,
          subject: `[Contact Form] ${data.subject || 'New Message'} — from ${data.name}`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
              <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px;border-radius:12px 12px 0 0;">
                <h1 style="color:white;font-size:20px;margin:0;">New Contact Form Message</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">${new Date().toLocaleString('en-AU')}</p>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <table style="font-size:14px;width:100%;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#64748b;width:80px;">Name</td><td style="padding:6px 0;font-weight:600;">${data.name}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#16a34a;">${data.email}</a></td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">Subject</td><td style="padding:6px 0;">${data.subject || 'General'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <h2 style="font-size:15px;color:#16a34a;margin:0 0 8px;">Message</h2>
                <div style="font-size:14px;line-height:1.7;color:#334155;background:#f8fafc;padding:16px;border-radius:8px;white-space:pre-wrap;">${data.message}</div>
              </div>
              <div style="padding:16px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                Reply directly to this email to respond to the customer.
              </div>
            </div>
          `,
        });

        // Also send confirmation to the customer
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [data.email],
          subject: 'We got your message! — Vapelink Australia',
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
              <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;font-size:20px;margin:0;">Thanks for reaching out, ${data.name}!</h1>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <p style="font-size:14px;color:#475569;line-height:1.6;">We've received your message and will get back to you within 24 hours on business days.</p>
                <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-top:12px;">
                  <p style="font-size:13px;color:#64748b;margin:0 0 4px;">Your message:</p>
                  <p style="font-size:14px;color:#334155;margin:0;white-space:pre-wrap;">${data.message}</p>
                </div>
              </div>
              <div style="padding:16px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                Vapelink Australia · <a href="https://vapelink.com.au" style="color:#16a34a;">vapelink.com.au</a>
              </div>
            </div>
          `,
        });
        break;
      }

      case 'btc-confirmed': {
        // Bitcoin payment confirmed — admin notification
        result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: `✅ BTC Payment Confirmed — ${data.orderNumber} ($${data.total} AUD)`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
              <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;border-radius:12px 12px 0 0;">
                <h1 style="color:white;font-size:20px;margin:0;">₿ Bitcoin Payment Confirmed</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Order ${data.orderNumber} — ${data.confirmations || '2+'}  confirmations</p>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
                <table style="font-size:14px;width:100%;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#64748b;">Customer</td><td style="padding:6px 0;font-weight:600;">${data.firstName} ${data.lastName}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;">${data.email}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">Total AUD</td><td style="padding:6px 0;font-weight:700;color:#16a34a;">$${data.total} AUD</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">BTC Amount</td><td style="padding:6px 0;font-weight:600;">${data.btcAmount || 'N/A'}</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;">TX ID</td><td style="padding:6px 0;font-size:12px;word-break:break-all;"><a href="https://mempool.space/tx/${data.txId}" style="color:#16a34a;">${data.txId || 'N/A'}</a></td></tr>
                </table>
                <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid rgba(22,163,74,0.2);text-align:center;">
                  <strong style="color:#16a34a;">✓ Ready to ship!</strong>
                </div>
              </div>
              <div style="padding:16px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                Vapelink Australia · vapelink.com.au
              </div>
            </div>
          `,
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    if (result?.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result?.data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
