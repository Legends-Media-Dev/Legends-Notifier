import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, Users as UsersIcon, Plus, ChevronDown, User, FolderTree, Gift, Settings, ShoppingBag, Home, ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAudienceActive = location.pathname === '/users' || location.pathname === '/segments';
  const isAppSettingsActive = location.pathname.startsWith('/app-settings');
  const isHomeActive = location.pathname.startsWith('/app-settings/home');
  const [openDropdown, setOpenDropdown] = useState<string | null>(() =>
    isAudienceActive ? 'Audience' : isAppSettingsActive ? 'App Settings' : null
  );
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(() => (isHomeActive ? 'Home' : null));

  useEffect(() => {
    if (location.pathname.startsWith('/app-settings')) setOpenDropdown('App Settings');
    else if (location.pathname === '/users' || location.pathname === '/segments') setOpenDropdown('Audience');
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/app-settings/home')) setOpenSubDropdown('Home');
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  type SubItemLink = { path: string; label: string; icon: React.ComponentType<{ className?: string }> };
  type SubItemGroup = { label: string; icon?: React.ComponentType<{ className?: string }>; subItems: SubItemLink[] };
  type NavItem =
    | { path: string; label: string; icon: React.ComponentType<{ className?: string }>; isDropdown?: false }
    | { label: string; icon: React.ComponentType<{ className?: string }>; isDropdown: true; subItems: (SubItemLink | SubItemGroup)[] };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Audience',
      icon: UsersIcon,
      isDropdown: true,
      subItems: [
        { path: '/users', label: 'Users', icon: User },
        { path: '/segments', label: 'Segments', icon: FolderTree },
      ],
    },
    {
      label: 'App Settings',
      icon: Settings,
      isDropdown: true,
      subItems: [
        { path: '/app-settings/shop-collections', label: 'Shop Collections', icon: ShoppingBag },
        {
          label: 'Home',
          icon: Home,
          subItems: [
            { path: '/app-settings/home/giveaway-snippet', label: 'Giveaway Snippet', icon: ImageIcon },
            { path: '/app-settings/home/category-snippet', label: 'Category Snippet', icon: ShoppingBag },
          ],
        },
      ],
    },
    { path: '/giveaway', label: 'Giveaway', icon: Gift },
    { path: '/new-notification', label: 'New Notification', icon: Plus },
  ];

  return (
    <nav className="min-w-72 w-max flex-shrink-0 h-screen bg-gray-900 flex flex-col">
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
              const isOpen = openDropdown === item.label;
              const isSectionActive = item.label === 'Audience' ? isAudienceActive : item.label === 'App Settings' ? isAppSettingsActive : false;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                      isSectionActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-4">
                      {item.subItems.map((subItem) => {
                        if ('path' in subItem) {
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
                        }
                        const isSubOpen = openSubDropdown === subItem.label;
                        const SubIcon = subItem.icon;
                        return (
                          <div key={subItem.label}>
                            <button
                              onClick={() => setOpenSubDropdown(isSubOpen ? null : subItem.label)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                                isHomeActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                {subItem.label}
                              </div>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isSubOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSubOpen && (
                              <div className="ml-2 mt-1 space-y-1 border-l border-gray-600 pl-3">
                                {subItem.subItems.map((link) => {
                                  const LinkIcon = link.icon;
                                  return (
                                    <Link
                                      key={link.path}
                                      to={link.path}
                                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                                        isActive(link.path)
                                          ? 'bg-gray-800 text-white'
                                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                      }`}
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                      {link.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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

