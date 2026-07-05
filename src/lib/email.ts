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
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        propertyTitle: data.propertyTitle,
        sourceUrl: data.sourceUrl
      })
    });
  } catch (err) {
    console.error('Failed to notify admin', err);
  }
};
