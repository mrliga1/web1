"use client";

import React, { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { db, doc, getDoc } from "../firebase";
import type { GeneralSettingsData } from "../types";
import { setTrackingConsent } from "../lib/tracking";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    getDoc(doc(db, "settings", "general"))
      .then((snapshot) => {
        const data = (snapshot.data() || {}) as GeneralSettingsData;
        if (cancelled || data.cookieConsentEnabled === false) return;
        // Chỉ trạng thái đồng ý mới tắt thông báo ở các lần tải trang sau.
        // Nếu người dùng đóng/từ chối, popup sẽ xuất hiện lại sau khi tải lại trang.
        if (localStorage.getItem("cookie_consent") !== "accepted") {
          timer = setTimeout(() => setShow(true), 1200);
        }
      })
      .catch((error) => {
        console.error("Không thể tải cấu hình cookie:", error);
        if (!cancelled && localStorage.getItem("cookie_consent") !== "accepted") {
          timer = setTimeout(() => setShow(true), 1200);
        }
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setTrackingConsent("granted");
    window.dispatchEvent(new CustomEvent("cookie_consent_changed", { detail: { status: "accepted" } }));
    setShow(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    setTrackingConsent("denied");
    window.dispatchEvent(new CustomEvent("cookie_consent_changed", { detail: { status: "declined" } }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-[80px] md:pb-6 pointer-events-none">
      <div role="alertdialog" aria-label="Thông báo cookie" className="relative w-full md:w-[830px] max-w-4xl mx-auto bg-bg-surface border border-border-inverse/60 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="w-full md:w-[830px] flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4 md:gap-6 p-[10px] items-start md:items-center text-[10px]">
          <div className="flex gap-4 items-start w-full">
            <div className="w-[30px] h-[30px] text-[10px] rounded-full bg-[#064E3B]/10 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 w-full md:w-[660px]">
              <h3 className="font-display font-bold text-[15px] text-text-primary pr-6">Chính sách Thu thập và Sử dụng Cookie</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed w-full">
                Chúng tôi sử dụng cookie để cải thiện trải nghiệm duyệt web của bạn, cung cấp các quảng cáo hoặc nội dung được cá nhân hóa và phân tích lưu lượng truy cập của chúng tôi. Bằng cách nhấp vào "Đồng ý", bạn đồng ý với việc chúng tôi sử dụng cookie. 
                <a 
                  href="/chinh-sach-bao-mat" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/chinh-sach-bao-mat');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="text-primary hover:underline ml-1"
                >Đọc thêm về chính sách quyền riêng tư</a>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col justify-end gap-3 w-full md:w-[80px]">
            <button
              onClick={acceptCookies}
              className="w-full flex-1 rounded-lg border border-primary bg-primary px-0 py-[5px] text-center text-[12px] font-bold text-white transition-colors hover:bg-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-[80px] md:flex-none"
            >
              Đồng ý
            </button>
            <button
              onClick={declineCookies}
              className="relative w-full flex-1 rounded-lg border border-[#b8d8cf] bg-white px-0 py-[5px] text-center text-[12px] font-semibold text-primary transition-colors hover:bg-[#e8f5f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-[80px] md:flex-none"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
