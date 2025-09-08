const express = require("express");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Invoice HTML Template with Styling
function generateInvoiceHTML(booking) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Oliveelements Invoice</title>
    <style>
      body { background:#f2f3f5; font-family:Arial,sans-serif; margin:0; }
      .header { background:#485839; color:#b1c685; display:flex; justify-content:space-between; padding:26px 5%; font-size:2em; font-weight:700; }
      .header .right { text-align:right; color:#fff; font-size:1rem; font-weight:normal; }
      .invoice-card { background:#fff; max-width:80%; margin:40px auto 0; border-radius:18px; box-shadow:0 2px 12px rgba(72,88,57,.09); padding:38px 32px; }
      h2 { margin:0 0 12px 0; font-size:1.25em; color:#222; }
      table { width:100%; border-collapse:collapse; margin-top:36px; }
      table, th, td { border:1px solid #e1e1e1; }
      th, td { padding:12px; font-size:1em; }
      th { background:#f2f3f5; text-align:left; }
      tfoot td { font-weight:bold; background:#f2f3f5; }
      .footer { background:#485839; color:#b1c685; display:flex; justify-content:space-between; padding:22px 5%; margin-top:36px; font-size:1.04em; }
    </style>
  </head>
  <body>
    <!-- Header -->
    <div class="header">
      Oliveelements
      <div class="right">
        Invoice #: ${booking.invoiceNo || "001"}<br>
        Date: ${new Date().toISOString().slice(0,10)}
      </div>
    </div>

    <!-- Invoice Card -->
    <div class="invoice-card">
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <div>
          <h2>Billing To</h2>
          Name: ${booking.name}<br>
          Email: ${booking.email}<br>
          Phone: ${booking.phone || "-"}
        </div>
        <div style="text-align:right;">
          <h2>Booking Details</h2>
          Product: ${booking.booking}<br>
          Check-in: ${booking.checkIn}<br>
          Check-out: ${booking.checkOut}<br>
          Guests: ${booking.guests}<br>
          Status: ${booking.status}
        </div>
      </div>
      <!-- Table -->
      <table>
        <thead>
          <tr><th>Item</th><th>Description</th><th style="text-align:right;">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Booking</td>
            <td>${booking.description || "Booking for Oliveelements"}</td>
            <td style="text-align:right;">₹${booking.amount}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align:right;">Total Paid</td>
            <td style="text-align:right;">₹${booking.amount}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        Thank you for booking with Oliveelements.<br>
        Oliveelements, Hyderabad, Telangana, India
      </div>
      <div style="text-align:right;">
        Contact: info@oliveelements.com<br>
        Phone: +91 9876543210
      </div>
    </div>
  </body>
  </html>
  `;
}

app.post("/send-invoice", async (req, res) => {
  try {
    const { email, booking } = req.body;

    const htmlContent = generateInvoiceHTML(booking);

    // Puppeteer PDF generation
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" }); // ✅ ensures CSS is applied

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Send email with PDF
    await transporter.sendMail({
      from: `"Oliveelements" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Invoice for your booking - ${booking.booking}`,
      text: "Please find your invoice attached.",
      attachments: [{ filename: "invoice.pdf", content: pdfBuffer }],
    });

    res.json({ success: true, message: "Invoice sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending invoice:", error);
    res.status(500).json({ success: false, message: "Failed to send invoice." });
  }
});


// ✅ Route to send invoice
app.post("/send-invoice", async (req, res) => {
  try {
    const { email, booking } = req.body;

    const htmlContent = generateInvoiceHTML(booking);

    // Puppeteer PDF generation
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await browser.close();

    // Send email with PDF
    await transporter.sendMail({
      from: `"Oliveelements" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Invoice for your booking - ${booking.booking}`,
      text: "Please find your invoice attached.",
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true, message: "Invoice sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending invoice:", error);
    res.status(500).json({ success: false, message: "Failed to send invoice." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
