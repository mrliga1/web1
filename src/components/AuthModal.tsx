import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// motion removed
import { X, Mail, Phone, User as UserIcon, Lock, Key, ArrowRight, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail
} from '../firebase';
import { doc, setDoc, getDoc } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  onLoginSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onShowNotification, onLoginSuccess }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot_password' | 'complete_profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !phone || !username) {
      onShowNotification('Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }
    setLoading(true);
    try {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods && methods.length > 0) {
          onShowNotification('Email này đã được sử dụng. Vui lòng đăng nhập.', 'error');
          setMode('login');
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        // Ignore check error if email enumeration protection is enabled
        console.warn('Check email error:', checkErr);
      }

      // MOCK sending OTP via email instead of SMS as real SMS requires provider setup
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Mã OTP Xác Thực Greenia',
          html: `<p>Xin chào ${username},</p><p>Mã OTP đăng ký tài khoản của bạn là: <strong>${code}</strong></p><p>Vui lòng không chia sẻ mã này.</p>`
        })
      });
      
      const data = await res.json();
      if (data.success) {
        onShowNotification('Mã OTP đã được gửi đến email của bạn!', 'success');
        setMode('otp');
      } else {
        onShowNotification('Lỗi khi gửi OTP: ' + data.error, 'error');
      }
    } catch (err) {
      onShowNotification('Sự cố đường truyền.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\s+/g, '') !== generatedOtp) {
      onShowNotification('Mã OTP không chính xác!', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let initialRole = 'user';
      if (user.email === 'thuankdbds@gmail.com' || user.email === 'Nguyenthanhthuan091095@gmail.com') {
        initialRole = 'admin';
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username,
        phone,
        role: initialRole,
        createdAt: new Date().toISOString()
      });
      
      onShowNotification('Đăng ký thành công! Bạn có thể bắt đầu sử dụng hệ thống.', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        onShowNotification('Email này đã được sử dụng. Vui lòng đăng nhập.', 'error');
        setMode('login');
        setOtp('');
      } else if (errCode === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed')) {
        onShowNotification('Phương thức đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.', 'error');
      } else if (errCode === 'auth/weak-password' || errMsg.includes('weak-password')) {
        onShowNotification('Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 6 ký tự.', 'error');
      } else if (errCode === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
        onShowNotification('Địa chỉ email không hợp lệ.', 'error');
      } else {
        onShowNotification('Đăng ký không thành công: ' + (errMsg || 'Lỗi Firebase'), 'error');
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
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        onShowNotification('Phương thức đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.', 'error');
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
      sessionStorage.setItem('redirect_after_login', 'true');
      const result = await signInWithPopup(auth, provider);
      
      const user = result?.user as {
        uid: string;
        email?: string | null;
        displayName?: string | null;
      } | null;
      if (!user) return; // Supabase OAuth redirects, so user will be null here
      
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (user.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com' || userData.role === 'admin' || (userData.phone && userData.username)) {
          onShowNotification('Đăng nhập thành công!', 'success');
          onClose();
          if (onLoginSuccess) onLoginSuccess();
          return;
        }
      } else if (user.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com') {
          // Allow admin to login even if document doesn't exist yet
          onShowNotification('Đăng nhập thành công!', 'success');
          onClose();
          if (onLoginSuccess) onLoginSuccess();
          return;
      }

      // If document doesn't exist or is missing required profile fields
      setEmail(user.email || '');
      setUsername(user.displayName || '');
      setMode('complete_profile');

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Ignore user closing popup
      } else if (err.code === 'auth/unauthorized-domain') {
        onShowNotification('Lỗi tên miền. Vui lòng bấm hình vuông mũi tên góc trên bên phải để MỞ APP Ở TAB MỚI, hoặc thêm aistudio.google.com vào Firebase.', 'error');
      } else if (err.code === 'auth/operation-not-allowed') {
        onShowNotification('Đăng nhập Google chưa được bật. Vui lòng vào Firebase > Authentication > Sign-in method để bật Google.', 'error');
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
      
      let initialRole = 'user';
      if (user.email === 'thuankdbds@gmail.com' || user.email === 'Nguyenthanhthuan091095@gmail.com') {
        initialRole = 'admin';
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username,
        phone,
        role: initialRole,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
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
    } catch (err: any) {
      console.error(err);
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
            className="absolute inset-0 bg-bg-inverse/80 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
          />
          
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Đăng nhập"
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-bg-surface border border-border-color rounded-2xl shadow-2xl p-5 md:p-6 animate-in zoom-in-95 duration-200"
          >
            <button 
              onClick={onClose}
              aria-label="Đóng"
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <h2 id="auth-modal-title" className="text-2xl font-display font-bold text-text-primary mb-2">
                {mode === 'login' && 'Đăng Nhập'}
                {mode === 'register' && 'Khởi Tạo Tài Khoản'}
                {mode === 'otp' && 'Xác Thực Mã OTP'}
                {mode === 'forgot_password' && 'Khôi phục mật khẩu'}
                {mode === 'complete_profile' && 'Cập Nhật Thông Tin'}
              </h2>
              <p className="text-text-secondary text-sm">
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
                  <label htmlFor="auth-cp-username" className="text-xs text-text-secondary font-medium">Tên hiển thị</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-cp-username"
                      required
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="Nguyen Van A"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-cp-phone" className="text-xs text-text-secondary font-medium">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-cp-phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="0912..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-cp-email" className="text-xs text-text-secondary font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-cp-email"
                      required
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-bg-surface/50 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-secondary text-sm outline-none cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-black font-bold rounded-xl py-2.5 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận thông tin'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {mode === 'forgot_password' && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-fp-email" className="text-xs text-text-secondary font-medium">Email của bạn</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-fp-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-black font-bold rounded-xl py-2.5 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã khôi phục'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-text-secondary font-bold text-sm hover:underline"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-login-email" className="text-xs text-text-secondary font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="auth-login-password" className="text-xs text-text-secondary font-medium">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs text-primary hover:underline border-none bg-transparent cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-login-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-black font-bold rounded-xl py-2.5 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border-inverse"></div>
                  <span className="flex-shrink-0 mx-4 text-text-secondary text-xs">Hoặc</span>
                  <div className="flex-grow border-t border-border-inverse"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 bg-bg-surface text-zinc-900 hover:bg-bg-base font-bold rounded-xl py-2.5 mt-2 transition-all disabled:opacity-50"
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
                  <span className="text-text-secondary text-sm">Chưa có tài khoản? </span>
                  <button 
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="auth-reg-username" className="text-xs text-text-secondary font-medium">Tên hiển thị</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input
                        id="auth-reg-username"
                        required
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                        placeholder="Nguyen Van A"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="auth-reg-phone" className="text-xs text-text-secondary font-medium">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input
                        id="auth-reg-phone"
                        required
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                        placeholder="0912..."
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-reg-email" className="text-xs text-text-secondary font-medium">Email (Nhận OTP)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-reg-email"
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="mail@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-reg-password" className="text-xs text-text-secondary font-medium">Mật khẩu (Sẽ dùng để đăng nhập truy cập)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-reg-password"
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-transparent border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-black font-bold rounded-xl py-2.5 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Gửi mã OTP (Qua Email)'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-2 items-center mt-4">
                  <div className="flex-grow border-t border-border-inverse"></div>
                  <span className="flex-shrink-0 mx-4 text-text-secondary text-xs">Hoặc đăng ký bằng</span>
                  <div className="flex-grow border-t border-border-inverse"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 bg-bg-surface text-zinc-900 hover:bg-bg-base font-bold rounded-xl py-2.5 transition-all disabled:opacity-50"
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
                  <span className="text-text-secondary text-sm">Đã có tài khoản? </span>
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {mode === 'otp' && (
              <form onSubmit={handleVerifyOTPAndRegister} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="auth-otp-code" className="text-xs text-text-secondary font-medium text-center block">Nhập mã OTP gồm 6 chữ số</label>
                  <div className="relative max-w-[200px] mx-auto">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="auth-otp-code"
                      required
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\s+/g, ''))}
                      maxLength={6}
                      className="w-full bg-transparent border border-border-color rounded-xl py-4 pl-10 pr-4 text-text-primary text-center text-xl tracking-[0.5em] font-mono outline-none focus:border-primary transition-colors"
                      placeholder="------"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-primary text-text-primary font-bold rounded-xl py-2.5 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác thực & Tạo tài khoản'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-text-secondary font-bold text-sm hover:underline"
                  >
                    Quay lại đăng ký
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
