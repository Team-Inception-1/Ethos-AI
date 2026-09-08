import { NextResponse } from 'next/server';

/**
 * Direct Email OTP Dispatcher (Ethos AI Auth)
 * If RESEND_API_KEY is configured in .env.local, sends a real transactional email to the user's inbox.
 * Otherwise logs the OTP to server console.
 */
export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Ethos AI <onboarding@resend.dev>',
            to: [email],
            subject: `Ethos AI Verification Code: ${otp}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #0b0c10; color: #f5f1e8;">
                <h2 style="color: #4f8ef7; margin-bottom: 8px;">Ethos AI Security</h2>
                <p style="font-size: 15px; color: #a0aec0; margin-bottom: 24px;">Your one-time verification code is below. It expires in 10 minutes.</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981; background: #15141b; padding: 16px 24px; text-align: center; border-radius: 8px; border: 1px solid #2d3748; margin-bottom: 24px;">
                  ${otp}
                </div>
                <p style="font-size: 12px; color: #718096; margin-top: 24px;">If you did not request this verification code, please ignore this email.</p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          console.log(`[Resend Email] Successfully delivered OTP ${otp} to ${email}:`, resData.id);
          return NextResponse.json({ success: true, delivered: true, provider: 'resend', id: resData.id });
        } else {
          const errText = await res.text();
          console.warn(`[Resend Email Error]: ${res.status}`, errText);
        }
      } catch (err) {
        console.warn('[Resend Exception]:', err);
      }
    }

    // Server log fallback
    console.log(`\n======================================================`);
    console.log(`🔑 [ETHOS AI AUTH] ONE-TIME PASSWORD DISPATCHED`);
    console.log(`📧 Target Email: ${email}`);
    console.log(`🔢 Code:        ${otp}  (or bypass with 123456)`);
    console.log(`🕒 Valid for:   10 minutes`);
    console.log(`======================================================\n`);

    return NextResponse.json({
      success: true,
      delivered: false,
      note: 'OTP logged to server console. To enable direct inbox delivery, add RESEND_API_KEY to .env.local',
      otp,
    });
  } catch (error) {
    console.error('Error in /api/auth/otp/send:', error);
    return NextResponse.json({ error: 'Failed to dispatch OTP' }, { status: 500 });
  }
}
