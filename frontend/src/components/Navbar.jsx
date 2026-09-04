import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Globe, LogOut, Menu, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Logo from './Logo'

const LINKS = [
  { to: '/services',     labelKey: 'nav_services',      fallback: 'Find Services' },
  { to: '/cooperatives', labelKey: 'nav_cooperatives',  fallback: 'Labour Cooperatives' },
  { to: '/about',        labelKey: 'nav_about',         fallback: 'Cooperative Model' },
  { to: '/worker',       labelKey: 'nav_worker_portal', fallback: 'Worker Portal' },
  { to: '/cooperative',  labelKey: 'nav_society_hub',   fallback: 'Society Hub' },
  { to: '/support',      labelKey: 'nav_support',       fallback: 'Help & Support' },
]

const DASHBOARD_PATH = {
  customer: '/customer',
  worker:   '/worker',
  cooperative_admin: '/cooperative',
  admin:    '/admin',
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { lang, setLanguage, t } = useLanguage()
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const linkClasses = ({ isActive }) =>
    `px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-[13.5px] 2xl:text-sm whitespace-nowrap transition-all rounded-lg ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold'
    }`

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setLoggingOut(false)
      closeMenu()
    }
  }

  const dashboardPath = user ? (DASHBOARD_PATH[user.role] || '/') : '/login'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-[1280px] 2xl:max-w-[1340px] 3xl:max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 2xl:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand + Verification Seal */}
        <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
          <Link to="/" onClick={closeMenu} aria-label="NEED Federation Home" className="flex items-center">
            <Logo />
          </Link>
          <div className="hidden xl:flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[17px]">verified</span>
            <span className="font-label-md text-xs text-on-surface font-medium">India Cooperative Act • Verified</span>
          </div>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {t(link.labelKey, link.fallback)}
            </NavLink>
          ))}
        </nav>

        {/* Right Desktop Utilities */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {/* Location / Civic Hub */}
          <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/50 shadow-sm text-xs text-on-surface font-semibold">
            <span className="material-symbols-outlined text-secondary text-[17px]">location_on</span>
            <span>Noida &amp; NCR</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-full border border-outline-variant/50 shadow-sm text-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[17px]">translate</span>
            <select
              value={lang}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer text-xs pr-1"
              aria-label="Select Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 bg-surface-container-high/80 hover:bg-surface-container-highest px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">
                  <User size={13} />
                </div>
                <span>{user.name.split(' ')[0]}</span>
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                  {user.role === 'cooperative_admin' ? 'Coop Admin' : user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-error transition"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                {t('nav_login', 'Log In')}
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-xs font-bold shadow-sm"
              >
                {t('nav_register', 'Join Cooperative')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-on-surface"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-t border-outline-variant/60 bg-surface px-4 py-4 lg:hidden shadow-lg animate-fade-in">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 text-xs">
              <span className="flex items-center gap-1 font-semibold text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[16px]">location_on</span>
                Noida &amp; NCR Service Zone
              </span>
              <select
                value={lang}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded border border-outline-variant bg-white px-2 py-1 text-xs"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`
                }
              >
                {t(link.labelKey, link.fallback)}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-outline-variant/40 mt-1">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to={dashboardPath}
                    onClick={closeMenu}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-on-surface font-semibold text-sm"
                  >
                    <span>{user.name} ({user.role})</span>
                    <span className="text-primary font-bold text-xs">Dashboard →</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full btn btn-outline text-error font-semibold text-sm"
                  >
                    {loggingOut ? 'Logging out…' : 'Log Out'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="btn btn-outline text-center text-sm font-semibold"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="btn btn-primary text-center text-sm font-semibold"
                  >
                    Join Co-op
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
