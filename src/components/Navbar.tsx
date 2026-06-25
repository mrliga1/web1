import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Building2, ShieldCheck, LogOut, User as UserIcon, Menu, X, Compass, Newspaper, Mail, Phone, Heart } from 'lucide-react';
import { RouteState, ScreenType } from '../types';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface NavbarProps {
  currentRoute: RouteState;
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  logoUrl?: string;
  isSettingsLoaded?: boolean;
}

export default function Navbar({ currentRoute, onNavigate, onShowNotification, logoUrl, isSettingsLoaded = false }: NavbarProps) {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const scrollDirection = useScrollDirection();
  const theme = 'dark';

  const handleSignOut = async () => {
    try {
      await logout();
      onShowNotification('Bạn đã đăng xuất tài khoản.', 'success');
      onNavigate({ screen: 'home' });
      setUserDropdownOpen(false);
    } catch (error) {
      onShowNotification('Lỗi đăng xuất khỏi hệ thống.', 'error');
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'editor';


  const menuItems = [
    { label: 'Trang Chủ', screen: 'home' as ScreenType, icon: Home },
    { label: 'Chuyển Nhượng', screen: 'san-pham' as ScreenType, icon: Building2 },
    { label: 'Dự Án', screen: 'du-an' as ScreenType, icon: Compass },
    { label: 'Tin Tức', screen: 'tin-tuc' as ScreenType, icon: Newspaper },
    { label: 'Liên Hệ', screen: 'lien-he' as ScreenType, icon: Mail },
  ];

  return (
    <>
      <div className="h-10 md:h-10 w-full shrink-0" />
      <nav className={`fixed top-0 w-full z-[110] transition-transform duration-300 border-b ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'} ${theme === 'dark' ? 'bg-slate-950/80 border-slate-900' : 'bg-white border-slate-200'}`} id="main-nav">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:bg-transparent ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-white'}`}>
        <div className="flex items-center justify-between h-10 md:h-10 relative">
          
          {/* Placeholder for flex balance on mobile */}
          <div className="block lg:hidden w-10" />

          {/* Brand Logo Identity */}
          <div 
            className="flex items-center gap-2 cursor-pointer group absolute left-1/2 -translate-x-1/2 lg:relative lg:left-0 lg:transform-none z-10"
            onClick={() => onNavigate({ screen: 'home' })}
            id="logo-container"
          >
            {logoUrl ? (
              <img loading="lazy" decoding="async" 
                src={(logoUrl) || undefined} 
                alt="Greenia Homes" 
                className="h-7 md:h-8 max-h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
                width={120}
                height={32}
              />
            ) : !isSettingsLoaded ? (
              <div className="w-[120px] h-8 bg-slate-200/20 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="bg-[#059669] text-white p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-all duration-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left font-display">
                  <span className={`text-[13px] font-bold tracking-tight block transition-colors leading-none ${theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-[#059669] group-hover:text-[#047857]'}`}>
                    Greenia <span className={theme === 'dark' ? 'text-amber-500' : 'text-[#047857]'}>Homes</span>
                  </span>
                  <span className={`text-[7px] uppercase font-bold tracking-widest block mt-0.5 font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-505'}`}>
                    Luxury Real Estate
                  </span>
                </div>
              </>
            )}
          </div>
 
          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-1" id="desktop-menu">
            {menuItems.map((item) => {
              // Exact active status matching screen type
              const active = currentRoute.screen === item.screen;
              return (
                <button
                  key={item.screen}
                  id={`nav-${item.screen}`}
                  onClick={() => {
                    onNavigate({ screen: item.screen });
                    setMobileMenuOpen(false);
                  }}
                  className={`relative px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
                    active 
                      ? theme === 'dark'
                        ? 'text-amber-400 font-bold' 
                        : 'text-slate-900 font-bold'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {active && (
                    <>
                      <motion.div 
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-full ${theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/10' : 'bg-[#eef3f6]'}`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    </>
                  )}
                </button>
              );
            })}
          </div>
 
          {/* Right section wrapper to group elements correctly on tablet/mobile */}
          <div className="flex items-center gap-2">
            {/* Right Action buttons Block */}
            <div className="hidden sm:flex items-center gap-2" id="user-controls">

              <button
                onClick={() => onNavigate({ screen: 'favorites' })}
                className={`p-1.5 rounded-full transition-all cursor-pointer border ${theme === 'dark' ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'border-amber-500/50 text-amber-600 hover:bg-amber-100'}`}
                title="Danh sách Yêu thích"
                aria-label="Danh sách Yêu thích"
              >
                <Heart className="w-4 h-4" />
              </button>
              
              {/* Theme switcher */}
   
              {/* 0932 966 700 Hotline Trigger with Icon */}
              <a 
                href="tel:0932966700" 
                className="flex items-center gap-1 bg-[#047857] hover:bg-[#065f46] text-white font-extrabold px-3.5 py-1.5 rounded-full text-[11px] transition-colors cursor-pointer shadow-lg shadow-emerald-500/10 hover:scale-[1.01]"
              >
                <Phone className="w-3 h-3 fill-white shrink-0" />
                <span>0932 966 700</span>
              </a>
   
              {currentUser ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setUserDropdownOpen(true)}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  {/* Micro avatar */}
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-label="Tài khoản người dùng"
                    className={`flex items-center justify-center border p-0.5 rounded-full transition-all cursor-pointer select-none ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-100 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="shrink-0">
                      {currentUser.photoURL ? (
                        <img loading="lazy" decoding="async" 
                          src={(currentUser.photoURL) || undefined} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full object-cover" 
                        />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Hover dropdown floating content */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 pt-2 z-20">
                        <div 
                          id="dropdown-user"
                          className={`w-36 border rounded-lg shadow-2xl py-0.5 overflow-hidden text-left ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onNavigate({ screen: 'admin' });
                              setUserDropdownOpen(false);
                            }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 text-[#047857]" />
                          <span>Khu Vực Quản Trị</span>
                        </button>
                        <button
                          id="logout-btn"
                          onClick={handleSignOut}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                            theme === 'dark'
                              ? 'text-rose-455 hover:bg-rose-500/10'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Đăng Xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="login-btn"
                  onClick={() => setAuthModalOpen(true)}
                  className={`border font-semibold py-1.5 px-3 rounded-full text-[11px] transition-transform hover:scale-[1.01] cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-850 text-slate-300 hover:text-white hover:border-slate-705'
                      : 'bg-slate-100 border-slate-200 text-slate-755 hover:text-slate-900'
                  }`}
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>

            {/* Mobile responsive toggle */}
            <div className="flex lg:hidden items-center gap-2" id="mobile-menu-controls">
              
              {/* Theme switcher for mobile removed */}

              <button
                onClick={() => onNavigate({ screen: 'favorites' })}
                className="sm:hidden flex items-center justify-center border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 p-2 rounded-lg"
                title="Yêu thích"
                aria-label="Yêu thích"
              >
                <Heart className="w-5 h-5" />
              </button>

              <button
                id="mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu di động"
                className="text-slate-405 hover:text-white p-2 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Drawer mobile dropdown list */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            id="mobile-dropdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-slate-950/95 border-b border-slate-900 text-left"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {menuItems.map((item) => {
                const active = currentRoute.screen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => {
                      onNavigate({ screen: item.screen });
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                      active 
                        ? 'text-amber-450 bg-amber-500/10' 
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-slate-900 space-y-3">
                <a 
                  href="tel:0932966700"
                  className="flex items-center justify-center gap-2 w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-lg text-xs"
                >
                  <Phone className="w-4 h-4 fill-slate-950" />
                  <span>HOTLINE: 0932 966 700</span>
                </a>

                {currentUser ? (
                  <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                    <p className="text-[10px] text-slate-400 truncate">Email: {currentUser.email}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { onNavigate({ screen: 'admin' }); setMobileMenuOpen(false); }}
                        className="flex-1 bg-slate-950 text-amber-450 text-xs py-2 rounded font-bold border border-slate-850"
                      >
                        Quản lý
                      </button>
                      <button 
                        onClick={handleSignOut}
                        className="flex-grow bg-rose-500/15 text-rose-455 text-xs py-2 rounded font-bold"
                      >
                        Thoát
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 py-2.5 rounded-lg text-xs font-bold border border-slate-850 cursor-pointer"
                  >
                    Đăng nhập / Đăng ký
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onShowNotification={onShowNotification} 
        onLoginSuccess={() => onNavigate({ screen: 'admin' })}
      />
    </nav>
    </>
  );
}
