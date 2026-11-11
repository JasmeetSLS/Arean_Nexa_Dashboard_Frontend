import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, LayoutDashboard, ShieldCheck, Settings, UserCog } from 'lucide-react';
import { useAuth } from '../service/auth.jsx';
import { usePermissions } from '../context/PermissionContext'; 

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { perms, loading } = usePermissions(); 

  const allNavItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, key: 'dashboard' },
    { path: '/setup', name: 'Setup Panel', icon: <Settings className="w-5 h-5" />, key: 'setup' },
    { path: '/role', name: 'Roles & Permissions', icon: <ShieldCheck className="w-5 h-5" />, key: 'role' },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!perms || !perms.pages) return true; 
    return perms.pages[item.key] !== false;  
  });

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-screen z-50 bg-black border-r border-white/20 shadow-xl flex flex-col transition-all duration-300 ease-in-out group w-20 hover:w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-white/20 overflow-hidden">
          <div className="flex items-center justify-center group-hover:justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="min-w-[40px] h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-orange-400 text-white px-5 py-2 shadow-sm">
                <UserCog size={20} />
              </div>
              <div className="opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 whitespace-nowrap">
                <h1 className="text-xl font-bold text-white">Contest Panel</h1>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white" /></button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {!loading && navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => onClose?.()}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/20 border border-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="min-w-[20px] flex justify-center">{item.icon}</span>
              <span className="opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 whitespace-nowrap">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/20">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5 min-w-[20px]" />
            <span className="opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;