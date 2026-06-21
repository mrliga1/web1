export const notifyAdminEmail = async (data: {
  name: string;
  phone: string;
  email?: string;
  propertyTitle: string;
  message?: string;
  sourceUrl: string;
}) => {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'thuankdbds@gmail.com',
        subject: `[CRM] Khách Hàng Mới - ${data.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f59e0b; padding: 15px; text-align: center;">
              <h2 style="color: #fff; margin: 0;">THÔNG BÁO CÓ KHÁCH HÀNG MỚI!</h2>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px;">Chào bạn, có một khách hàng vừa để lại thông tin cần tư vấn trên hệ thống.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>👤 Họ và tên:</strong> <span style="color: #d97706; font-size: 16px;">${data.name}</span></p>
                <p style="margin: 5px 0;"><strong>📞 Điện thoại:</strong> <span style="font-weight: bold; font-size: 16px;">${data.phone}</span></p>
                ${data.email ? `<p style="margin: 5px 0;"><strong>✉️ Email:</strong> ${data.email}</p>` : ''}
                <p style="margin: 5px 0;"><strong>📝 Nhu cầu:</strong> ${data.message || '<i>Không có ghi chú thêm</i>'}</p>
              </div>

              <div style="border-left: 4px solid #f59e0b; padding-left: 15px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>🔖 Nguồn liên hệ (Sản phẩm/Trang):</strong> ${data.propertyTitle}</p>
                <p style="margin: 10px 0 5px 0;"><strong>🔗 Link khách xem:</strong> <a href="${data.sourceUrl}" target="_blank" style="color: #3b82f6;">${data.sourceUrl}</a></p>
                <p style="margin: 5px 0;"><strong>🌐 IP Khách hàng:</strong> {{CLIENT_IP}}</p>
              </div>
              
              <p style="font-size: 13px; color: #666; margin-top: 30px;">
                Vui lòng vào màn hình Quản Trị CRM để phân bổ nhân viên và lên lịch chăm sóc tư vấn cho khách hàng này.
              </p>
            </div>
            <div style="background-color: #1e293b; padding: 10px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Thông báo tự động từ Hệ thống Quản trị Web BDS</p>
            </div>
          </div>
        `
      })
    });
  } catch (err) {
    console.error('Failed to notify admin', err);
  }
};
