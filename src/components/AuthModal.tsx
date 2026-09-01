import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// Đã bỏ motion trong modal này để giảm chi phí hiển thị.
import { X, Mail, Phone, User as UserIcon, Lock, Key, ArrowRight, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from '../firebase';
import { doc, setDoc, getDoc } from '../firebase';
import { trackCompleteRegistration } from '../lib/tracking';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  onLoginSuccess?: () => void;
}

type AuthError = Error & { code?: string };
type UserProfileSnapshot = {
  role?: string;
  phone?: string;
  username?: string;
};

const toAuthError = (err: unknown): AuthError => {
  if (err instanceof Error) return err as AuthError;
  return new Error(String(err)) as AuthError;
};

const AUTH_INPUT_CLASS = 'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0b6b53] focus:ring-2 focus:ring-[#0b6b53]/20 transition-colors';
const AUTH_PRIMARY_BUTTON_CLASS = 'w-full flex items-center justify-center gap-2 rounded-xl bg-[#075c47] py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-[#064838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6b53] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const AUTH_SECONDARY_BUTTON_CLASS = 'w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 font-bold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6b53] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const AUTH_LINK_CLASS = 'font-bold text-[#075c47] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6b53]/40';

type OtpApiResponse = {
  success?: boolean;
  challenge?: string;
  expiresInSeconds?: number;
  error?: string;
};

async function readOtpResponse(response: Response): Promise<OtpApiResponse> {
  try {
    return await response.json() as OtpApiResponse;
  } catch {
    return { error: 'Máy chủ trả về dữ liệu không hợp lệ.' };
  }
}

export default function AuthModal({ isOpen, onClose, onShowNotification, onLoginSuccess }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot_password' | 'complete_profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [otpChallenge, setOtpChallenge] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/[\s.()-]/g, '');
    if (!normalizedEmail || !password || !normalizedPhone || !username.trim()) {
      onShowNotification('Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      onShowNotification('Mật khẩu phải có từ 8 đến 72 ký tự.', 'error');
      return;
    }
    if (!/^\+?\d{9,15}$/.test(normalizedPhone)) {
      onShowNotification('Số điện thoại không hợp lệ.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: normalizedEmail,
          username: username.trim(),
          phone: normalizedPhone,
        }),
      });

      const data = await readOtpResponse(response);
      if (!response.ok || !data.success || !data.challenge) {
        throw new Error(data.error || 'Không thể gửi mã OTP.');
      }

      setEmail(normalizedEmail);
      setPhone(normalizedPhone);
      setOtp('');
      setOtpChallenge(data.challenge);
      setMode('otp');
      onShowNotification('Mã OTP đã được gửi đến email của bạn và có hiệu lực trong 10 phút.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sự cố đường truyền.';
      onShowNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedOtp = otp.replace(/\D/g, '');
    if (!otpChallenge) {
      onShowNotification('Phiên xác thực đã mất. Vui lòng yêu cầu mã OTP mới.', 'error');
      setMode('register');
      return;
    }
    if (!/^\d{6}$/.test(normalizedOtp)) {
      onShowNotification('Mã OTP phải gồm đúng 6 chữ số.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          challenge: otpChallenge,
          otp: normalizedOtp,
          password,
        }),
      });

      const data = await readOtpResponse(response);
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể xác thực mã OTP.');
      }

      await signInWithEmailAndPassword(auth, email, password);
      setOtpChallenge('');
      trackCompleteRegistration('email');
      onShowNotification('Đăng ký thành công! Bạn có thể bắt đầu sử dụng hệ thống.', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: unknown) {
      const authError = toAuthError(err);
      console.error(authError);
      const errMsg = authError.message || '';
      if (/đã được sử dụng|already|registered|exists/i.test(errMsg)) {
        onShowNotification('Email này đã được sử dụng. Vui lòng đăng nhập.', 'error');
        setMode('login');
        setOtp('');
      } else {
        onShowNotification(errMsg || 'Đăng ký không thành công.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onShowNotification('Vui lòng nhập Email và Mật khẩu.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onShowNotification('Đăng nhập thành công!', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: unknown) {
      const authError = toAuthError(err);
      console.error(authError);
      if (authError.code === 'auth/operation-not-allowed') {
        onShowNotification('Phương thức đăng nhập bằng Email/Mật khẩu chưa được bật trong Supabase Auth.', 'error');
      } else {
        onShowNotification('Email hoặc mật khẩu không chính xác.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      sessionStorage.setItem('redirect_after_login', 'admin');
      const result = await signInWithPopup(auth, provider);
      
      const user = result?.user as {
        uid: string;
        email?: string | null;
        displayName?: string | null;
      } | null;
      if (!user) return; // Supabase OAuth sẽ chuyển hướng nên user có thể là null tại đây.
      
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const userData = (docSnap.data() || {}) as UserProfileSnapshot;
        if (user.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com' || userData.role === 'admin' || (userData.phone && userData.username)) {
          onShowNotification('Đăng nhập thành công!', 'success');
          onClose();
          if (onLoginSuccess) onLoginSuccess();
          return;
        }
      } else if (user.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com') {
          // Cho phép admin đăng nhập cả khi document chưa tồn tại.
          onShowNotification('Đăng nhập thành công!', 'success');
          onClose();
          if (onLoginSuccess) onLoginSuccess();
          return;
      }

      // Nếu document chưa có hoặc thiếu trường hồ sơ bắt buộc.
      setEmail(user.email || '');
      setUsername(user.displayName || '');
      setMode('complete_profile');

    } catch (err: unknown) {
      const authError = toAuthError(err);
      console.error(authError);
      if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
        // Bỏ qua khi người dùng tự đóng popup.
      } else if (authError.code === 'auth/unauthorized-domain') {
        onShowNotification('Tên miền hiện tại chưa được cho phép trong cấu hình Supabase Auth.', 'error');
      } else if (authError.code === 'auth/operation-not-allowed') {
        onShowNotification('Đăng nhập Google chưa được bật trong Supabase Auth Providers.', 'error');
      } else {
        onShowNotification('Đăng nhập Google thất bại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !username) {
      onShowNotification('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Chưa đăng nhập Google');
      }
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username,
        phone,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      trackCompleteRegistration('google');
      onShowNotification('Cập nhật thông tin và đăng nhập thành công!', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error(error);
      onShowNotification('Cập nhật thông tin thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onShowNotification('Vui lòng nhập Email để khôi phục mật khẩu.', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      onShowNotification('Email khôi phục mật khẩu đã được gửi!', 'success');
      setMode('login');
    } catch (err: unknown) {
      console.error(toAuthError(err));
      onShowNotification('Không thể gửi email khôi phục. Vui lòng kiểm tra lại email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 mt-10 md:mt-0">
          <div 
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
          />
          
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Đăng nhập"
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl md:p-6 animate-in zoom-in-95 duration-200"
          >
            <button 
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6b53]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <h2 id="auth-modal-title" className="mb-2 text-2xl font-display font-bold text-[#073f32]">
                {mode === 'login' && 'Đăng Nhập'}
                {mode === 'register' && 'Khởi Tạo Tài Khoản'}
                {mode === 'otp' && 'Xác Thực Mã OTP'}
                {mode === 'forgot_password' && 'Khôi phục mật khẩu'}
                {mode === 'complete_profile' && 'Cập Nhật Thông Tin'}
              </h2>
              <p className="text-sm text-slate-600">
                {mode === 'login' && 'Chào mừng bạn trở lại với Greenia Hệ sinh thái BĐS'}
                {mode === 'register' && 'Đăng ký nhanh chóng để quản lý BĐS của bạn'}
                {mode === 'otp' && 'Vui lòng kiểm tra hộp thư email (hoặc thư rác) để lấy mã'}
                {mode === 'forgot_password' && 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu'}
                {mode === 'complete_profile' && 'Vui lòng bổ sung thêm thông tin để hoàn tất đăng ký'}
              </p>
            </div>

            {mode === 'complete_profile' && (
              <form onSubmit={handleCompleteProfile} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-cp-username" className="text-xs font-semibold text-slate-700">Tên hiển thị</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-cp-username"
                      required
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="Nguyen Van A"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-cp-phone" className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-cp-phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="0912..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-cp-email" className="text-xs font-semibold text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-cp-email"
                      required
                      type="email"
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-4`}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận thông tin'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {mode === 'forgot_password' && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-fp-email" className="text-xs font-semibold text-slate-700">Email của bạn</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-fp-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-4`}
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã khôi phục'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className={`${AUTH_LINK_CLASS} text-sm`}
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-login-email" className="text-xs font-semibold text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="auth-login-password" className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className={`${AUTH_LINK_CLASS} cursor-pointer border-none bg-transparent text-xs`}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-login-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-4`}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="mx-4 flex-shrink-0 text-xs text-slate-500">Hoặc</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className={`${AUTH_SECONDARY_BUTTON_CLASS} mt-2`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Tiếp tục với Google
                </button>

                <div className="text-center mt-4">
                  <span className="text-sm text-slate-600">Chưa có tài khoản? </span>
                  <button 
                    type="button"
                    onClick={() => setMode('register')}
                    className={`${AUTH_LINK_CLASS} text-sm`}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1">
                    <label htmlFor="auth-reg-username" className="text-xs font-semibold text-slate-700">Tên hiển thị</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-reg-username"
                        required
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className={AUTH_INPUT_CLASS}
                        placeholder="Nguyen Van A"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="auth-reg-phone" className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-reg-phone"
                        required
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className={AUTH_INPUT_CLASS}
                        placeholder="0912..."
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-reg-email" className="text-xs font-semibold text-slate-700">Email (Nhận OTP)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-reg-email"
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-reg-password" className="text-xs font-semibold text-slate-700">Mật khẩu (Từ 8 ký tự)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-reg-password"
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={AUTH_INPUT_CLASS}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-4`}
                >
                  {loading ? 'Đang xử lý...' : 'Gửi mã OTP (Qua Email)'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-2 items-center mt-4">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="mx-4 flex-shrink-0 text-xs text-slate-500">Hoặc đăng ký bằng</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className={AUTH_SECONDARY_BUTTON_CLASS}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Đăng ký với Google
                </button>

                <div className="text-center mt-4">
                  <span className="text-sm text-slate-600">Đã có tài khoản? </span>
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className={`${AUTH_LINK_CLASS} text-sm`}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {mode === 'otp' && (
              <form onSubmit={handleVerifyOTPAndRegister} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="auth-otp-code" className="block text-center text-xs font-semibold text-slate-700">Nhập mã OTP gồm 6 chữ số</label>
                  <div className="relative max-w-[200px] mx-auto">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-otp-code"
                      required
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      className="w-full rounded-xl border border-slate-300 bg-white py-4 pl-10 pr-4 text-center font-mono text-xl tracking-[0.5em] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0b6b53] focus:ring-2 focus:ring-[#0b6b53]/20"
                      placeholder="------"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-4`}
                >
                  {loading ? 'Đang xử lý...' : 'Xác thực & Tạo tài khoản'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setOtp('');
                      setOtpChallenge('');
                      setMode('register');
                    }}
                    className={`${AUTH_LINK_CLASS} text-sm`}
                  >
                    Yêu cầu mã OTP mới
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>,
    document.body
  );
}
