import nodemailer from 'nodemailer';

// ─── Transporter (lazy-init to avoid crashing if EMAIL_USER not set) ──────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) return null; // Email not configured — silently skip

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  return _transporter;
}

// ─── Generic send helper ──────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] Skipped (not configured): ${subject} → ${to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"RentEase 🏠" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[Email] Sent: "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message);
    // Never throw — email failure must not break the main flow
  }
}

// ─── Booking Confirmation (Tenant) ────────────────────────────────────────────
export async function sendBookingConfirmation({ tenantEmail, tenantName, rentals }) {
  const itemRows = rentals
    .map((r) => {
      const title = r.productId?.title || 'Item';
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${title}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${r.tenure} months</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${r.monthlyPrice}/mo</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${r.deposit}</td>
        </tr>`;
    })
    .join('');

  await sendMail({
    to: tenantEmail,
    subject: '✅ RentEase — Your Rental Order is Confirmed!',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px 16px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0 0 6px;">🏠 RentEase</h1>
          <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Furniture &amp; Appliance Rentals</p>

          <h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 8px;">Hi ${tenantName} 👋</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Your rental order has been <strong>successfully placed</strong>! The vendor will review your request and schedule delivery within <strong>48 business hours</strong>.
          </p>

          <h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 12px;">Order Summary</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;">Product</th>
                <th style="padding:10px 14px;text-align:center;color:#6b7280;font-weight:600;">Tenure</th>
                <th style="padding:10px 14px;text-align:right;color:#6b7280;font-weight:600;">Monthly</th>
                <th style="padding:10px 14px;text-align:right;color:#6b7280;font-weight:600;">Deposit</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 18px;font-size:13px;color:#065f46;margin-bottom:24px;">
            ✅ Free repair support &amp; relocation assistance included with every rental.
          </div>

          <p style="font-size:12px;color:#9ca3af;margin:0;">
            If you have questions, just reply to this email.<br/>
            © ${new Date().getFullYear()} RentEase — Affordable, Flexible Home Rentals
          </p>
        </div>
      </div>
    `
  });
}

// ─── Landlord Booking Alert ───────────────────────────────────────────────────
export async function sendLandlordBookingAlert({ landlordEmail, landlordName, rental }) {
  const title = rental.productId?.title || 'Item';
  await sendMail({
    to: landlordEmail,
    subject: '🔔 RentEase — New Rental Request Received',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px 16px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0 0 6px;">🏠 RentEase</h1>
          <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Furniture &amp; Appliance Rentals</p>

          <h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 8px;">Hi ${landlordName},</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
            A new rental request has been placed for one of your products.
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
            <tr style="background:#f3f4f6;">
              <td style="padding:10px 14px;font-weight:600;color:#6b7280;">Product</td>
              <td style="padding:10px 14px;">${title}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#6b7280;">Tenant</td>
              <td style="padding:10px 14px;">${rental.tenantName}</td>
            </tr>
            <tr style="background:#f3f4f6;">
              <td style="padding:10px 14px;font-weight:600;color:#6b7280;">Tenure</td>
              <td style="padding:10px 14px;">${rental.tenure} months</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#6b7280;">Monthly Price</td>
              <td style="padding:10px 14px;">₹${rental.monthlyPrice}/mo</td>
            </tr>
            <tr style="background:#f3f4f6;">
              <td style="padding:10px 14px;font-weight:600;color:#6b7280;">Delivery Address</td>
              <td style="padding:10px 14px;">${rental.deliveryAddress || 'Not provided'}</td>
            </tr>
          </table>

          <p style="font-size:13px;color:#374151;">Log in to your <strong>Landlord Dashboard</strong> to approve or decline this request.</p>
          <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
            © ${new Date().getFullYear()} RentEase — Affordable, Flexible Home Rentals
          </p>
        </div>
      </div>
    `
  });
}

// ─── Maintenance Status Update (Tenant) ──────────────────────────────────────
export async function sendMaintenanceUpdate({ tenantEmail, tenantName, ticket, newStatus }) {
  const statusLabels = {
    'pending':     { emoji: '🕐', label: 'Pending Review',  color: '#d97706' },
    'in-progress': { emoji: '🔧', label: 'In Progress',     color: '#2563eb' },
    'resolved':    { emoji: '✅', label: 'Resolved',        color: '#059669' },
    'rejected':    { emoji: '❌', label: 'Rejected',        color: '#dc2626' }
  };
  const st = statusLabels[newStatus] || { emoji: '📋', label: newStatus, color: '#374151' };
  const productTitle = ticket.productId?.title || 'Your rented item';

  await sendMail({
    to: tenantEmail,
    subject: `${st.emoji} RentEase — Maintenance Request Update: ${st.label}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px 16px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0 0 6px;">🏠 RentEase</h1>
          <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Maintenance &amp; Support</p>

          <h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 8px;">Hi ${tenantName},</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Your maintenance request for <strong>${productTitle}</strong> has been updated.
          </p>

          <div style="background:#f3f4f6;border-left:4px solid ${st.color};border-radius:6px;padding:16px 20px;margin-bottom:20px;">
            <span style="font-size:16px;font-weight:800;color:${st.color};">${st.emoji} Status: ${st.label}</span>
          </div>

          ${ticket.technicianNotes ? `
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;font-size:13px;color:#374151;margin-bottom:20px;">
            <strong>Technician Notes:</strong><br/>
            ${ticket.technicianNotes}
          </div>` : ''}

          <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
            © ${new Date().getFullYear()} RentEase — Affordable, Flexible Home Rentals
          </p>
        </div>
      </div>
    `
  });
}
