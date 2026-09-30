export type CookieConsentChoice = 'accepted' | 'declined';

const choiceAttribute = 'data-greenia-cookie-choice';
const isChoice = (value: string | null): value is CookieConsentChoice =>
  value === 'accepted' || value === 'declined';

// Chạy trong head để ẩn thông báo đã xử lý trước lần vẽ đầu tiên.
export const COOKIE_CHOICE_BOOTSTRAP = "try{var cookieChoice=localStorage.getItem('cookie_consent');if(cookieChoice==='accepted'||cookieChoice==='declined'){document.documentElement.setAttribute('data-greenia-cookie-choice',cookieChoice);}}catch(e){}";

export function readCookieConsentChoice(): CookieConsentChoice | null {
  try {
    const stored = localStorage.getItem('cookie_consent');
    if (isChoice(stored)) return stored;
  } catch { /* Dùng lựa chọn trong phiên khi trình duyệt chặn lưu trữ. */ }
  const current = document.documentElement.getAttribute(choiceAttribute);
  return isChoice(current) ? current : null;
}

export function saveCookieConsentChoice(choice: CookieConsentChoice): void {
  document.documentElement.setAttribute(choiceAttribute, choice);
  try { localStorage.setItem('cookie_consent', choice); }
  catch { /* Thuộc tính trên trang giữ lựa chọn đến khi tải lại. */ }
}
