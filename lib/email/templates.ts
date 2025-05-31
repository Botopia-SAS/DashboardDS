export function getEmailTemplate({ name, body, greeting = "Hello" }: { name: string; body: string; greeting?: string }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
        <div style="background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;">
          <h2 style="margin: 0; font-size: 1.7rem; letter-spacing: 1px;">Driving School Notification</h2>
        </div>
        <div style="padding: 32px 32px 16px 32px;">
          <p style="font-size: 1.1rem; margin-bottom: 18px;">${greeting}, <b>${name}</b>!</p>
          <p style="font-size: 1.1rem; margin-bottom: 18px;">${body}</p>
        </div>
        <div style="background: #0f172a; color: #fff; text-align: center; padding: 16px 32px; font-size: 0.95rem; border-top: 1px solid #cbd5e1;">
          <p style="margin: 0; font-weight: bold;">Affordable Driving<br/>Traffic School</p>
          <p style="margin: 0;">West Palm Beach, FL | info@drivingschoolpalmbeach.com | 561 330 7007</p>
          <p style="margin: 0; font-size: 0.93rem; color: #cbd5e1;">&copy; ${new Date().getFullYear()} Powered By Botopia Technology S.A.S</p>
        </div>
      </div>
    </div>
  `;
} 