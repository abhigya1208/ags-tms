import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { useTheme } from '../../services/ThemeContext';
import toast from 'react-hot-toast';
import {
  HomeIcon, UsersIcon, AcademicCapIcon, ClipboardDocumentListIcon,
  ComputerDesktopIcon, Bars3Icon, ArrowRightOnRectangleIcon,
  UserCircleIcon, ExclamationTriangleIcon, SunIcon, MoonIcon,
  ChatBubbleLeftRightIcon,  // ✅ CHAT ICON ADD KIYA
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard', exact: true },
  { to: '/students', icon: UsersIcon, label: 'Students' },
  { to: '/teachers', icon: AcademicCapIcon, label: 'Teachers', adminOnly: true },
  { to: '/defaulters', icon: ExclamationTriangleIcon, label: 'Defaulters', adminOnly: true },
  { to: '/logs', icon: ClipboardDocumentListIcon, label: 'Audit Logs', adminOnly: true },
  { to: '/sessions', icon: ComputerDesktopIcon, label: 'Sessions', adminOnly: true },
  { to: '/chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },  // ✅ CHAT NAVIGATION ADD KIYA
];

// Reusable toggle — full-row for sidebar, icon-only for mobile header
const ThemeToggle = ({ compact = false }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={
        compact
          ? 'p-2 rounded-lg text-sage-600 hover:bg-sage-100 dark:text-sage-300 dark:hover:bg-gray-700 transition-colors'
          : 'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sage-700 hover:bg-sage-100 dark:text-sage-300 dark:hover:bg-gray-700/60 transition-colors'
      }
    >
      {isDark
        ? <SunIcon  className="w-5 h-5 flex-shrink-0 text-amber-400" />
        : <MoonIcon className="w-5 h-5 flex-shrink-0 text-sage-500" />
      }
      {!compact && (isDark ? 'Light Mode' : 'Dark Mode')}
    </button>
  );
};

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); navigate('/login'); }
    catch { toast.error('Logout failed'); }
    finally { setLoggingOut(false); }
  };

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-sage-500 text-white shadow-sm'
            : 'text-sage-700 hover:bg-sage-100 hover:text-sage-900 dark:text-sage-300 dark:hover:bg-gray-700/60 dark:hover:text-white'
        }`
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {item.label}
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sage-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center shadow-sm">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-sage-800 dark:text-sage-200 text-lg font-bold leading-tight">AGS</h1>
            <p className="text-xs text-sage-500 dark:text-sage-400 font-body">Tutorial Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Bottom: theme toggle + profile + logout */}
      <div className="px-3 pb-4 border-t border-sage-100 dark:border-gray-700/60 pt-3 space-y-1">
        <ThemeToggle />

        <NavLink to="/profile" onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-sage-100 dark:hover:bg-gray-700/60 transition-colors group">
          <UserCircleIcon className="w-5 h-5 text-sage-400 group-hover:text-sage-600 dark:text-sage-500 dark:group-hover:text-sage-300" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sage-800 dark:text-sage-200 truncate">{user?.name}</p>
            <p className="text-xs text-sage-500 dark:text-sage-400 capitalize">{user?.role}</p>
          </div>
        </NavLink>

        <button onClick={handleLogout} disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white dark:bg-gray-900 border-r border-sage-100 dark:border-gray-700/60 shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-sage-100 dark:border-gray-700/60 shadow-sm">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-gray-700 text-sage-700 dark:text-sage-300">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sage-800 dark:text-sage-200">AGS TMS</span>
          </div>
          {/* Icon-only toggle in mobile header */}
          <ThemeToggle compact />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;