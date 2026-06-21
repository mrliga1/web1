import React, { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
        // Show after a small delay to not block initial render
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-[80px] md:pb-6 pointer-events-none">
      <div className="relative w-full md:w-[830px] max-w-4xl mx-auto bg-slate-900 border border-slate-700/60 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="w-full md:w-[830px] flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4 md:gap-6 p-[10px] items-start md:items-center text-[10px]">
          <div className="flex gap-4 items-start w-full">
            <div className="w-[30px] h-[30px] text-[10px] rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2 w-full md:w-[660px]">
              <h3 className="font-display font-bold text-[15px] text-white pr-6">Chính sách Thu thập và Sử dụng Cookie</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed w-full">
                Chúng tôi sử dụng cookie để cải thiện trải nghiệm duyệt web của bạn, cung cấp các quảng cáo hoặc nội dung được cá nhân hóa và phân tích lưu lượng truy cập của chúng tôi. Bằng cách nhấp vào "Đồng ý", bạn đồng ý với việc chúng tôi sử dụng cookie. 
                <a 
                  href="/privacy-policy" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/privacy-policy');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="text-amber-500 hover:underline ml-1"
                >Đọc thêm về chính sách quyền riêng tư</a>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col justify-end gap-3 w-full md:w-[80px]">
            <button
              onClick={acceptCookies}
              className="flex-1 md:flex-none py-[5px] px-0 w-full md:w-[80px] text-[12px] bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors text-center"
            >
              Đồng ý
            </button>
            <button
              onClick={declineCookies}
              className="flex-1 md:flex-none py-[5px] px-0 w-full md:w-[80px] text-[12px] bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700 text-center relative"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
