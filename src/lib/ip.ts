export const fetchClientIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || '';
  } catch (err) {
    console.error('Error fetching IP:', err);
    return '';
  }
};
