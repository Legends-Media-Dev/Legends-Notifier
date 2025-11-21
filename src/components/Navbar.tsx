import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, Users as UsersIcon, Plus, ChevronDown, User, FolderTree } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAudienceActive = location.pathname === '/users' || location.pathname === '/segments';
  const [isAudienceOpen, setIsAudienceOpen] = useState(isAudienceActive);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  type NavItem = 
    | { path: string; label: string; icon: React.ComponentType<{ className?: string }>; isDropdown?: false }
    | { label: string; icon: React.ComponentType<{ className?: string }>; isDropdown: true; subItems: Array<{ path: string; label: string; icon: React.ComponentType<{ className?: string }> }> };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      label: 'Audience', 
      icon: UsersIcon,
      isDropdown: true,
      subItems: [
        { path: '/users', label: 'Users', icon: User },
        { path: '/segments', label: 'Segments', icon: FolderTree },
      ]
    },
    { path: '/new-notification', label: 'New Notification', icon: Plus },
  ];

  return (
    <nav className="w-64 flex-shrink-0 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="bg-apple-blue rounded-xl p-2">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Legends Notifier</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.isDropdown && 'subItems' in item) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                      isAudienceActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${isAudienceOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  {isAudienceOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-4">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                              isActive(subItem.path)
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-gray-700 mb-2.5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

