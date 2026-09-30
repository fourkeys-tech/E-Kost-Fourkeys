import cron from 'node-cron';
import { generateInvoices, calculateLateFees, sendPaymentReminders } from '../services/invoiceService';

export function startCronJobs(): void {
  // Jalankan setiap hari jam 08:00 — generate invoice H-7
  cron.schedule('0 8 * * *', async () => {
    console.log('🔄 [CRON] Generate invoices H-7...');
    await generateInvoices().catch(console.error);
  });

  // Jalankan setiap hari jam 09:00 — hitung denda
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 [CRON] Calculate late fees...');
    await calculateLateFees().catch(console.error);
  });

  // Jalankan setiap hari jam 10:00 — kirim reminder H-3 dan H-1
  cron.schedule('0 10 * * *', async () => {
    console.log('🔄 [CRON] Send payment reminders...');
    await sendPaymentReminders().catch(console.error);
  });

  console.log('✅ Cron jobs started');
}
