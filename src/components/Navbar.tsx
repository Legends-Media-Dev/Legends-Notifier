import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  Megaphone,
  Users as UsersIcon,
  ChevronDown,
  User,
  FolderTree,
  Gift,
  Settings,
  ShoppingBag,
  Home,
  ImageIcon,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isAudienceActive = location.pathname === '/users' || location.pathname === '/segments';
  const isAppSettingsActive = location.pathname.startsWith('/app-settings');
  const isHomeActive = location.pathname.startsWith('/app-settings/home');

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);

  const closeAllMenus = () => {
    setOpenDropdown(null);
    setOpenSubDropdown(null);
  };

  // Keep menus in sync with the current route
  useEffect(() => {
    if (location.pathname.startsWith('/app-settings/home')) {
      setOpenDropdown('App Settings');
      setOpenSubDropdown('Home');
    } else if (location.pathname.startsWith('/app-settings')) {
      setOpenDropdown('App Settings');
      setOpenSubDropdown(null);
    } else if (location.pathname === '/users' || location.pathname === '/segments') {
      setOpenDropdown('Audience');
      setOpenSubDropdown(null);
    } else {
      closeAllMenus();
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const toggleDropdown = (label: string) => {
    if (openDropdown === label) {
      closeAllMenus();
    } else {
      setOpenDropdown(label);
      setOpenSubDropdown(null);
    }
  };

  const toggleSubDropdown = (label: string) => {
    setOpenSubDropdown((current) => (current === label ? null : label));
  };

  type SubItemLink = { path: string; label: string; icon: React.ComponentType<{ className?: string }> };
  type SubItemGroup = { label: string; icon?: React.ComponentType<{ className?: string }>; subItems: SubItemLink[] };
  type NavItem =
    | { path: string; label: string; icon: React.ComponentType<{ className?: string }>; isDropdown?: false }
    | { label: string; icon: React.ComponentType<{ className?: string }>; isDropdown: true; subItems: (SubItemLink | SubItemGroup)[] };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
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
  ];

  const linkClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
      active
        ? 'bg-accent text-white shadow-sm'
        : 'text-zinc-400 hover:bg-ink-light hover:text-white'
    }`;

  return (
    <nav className="w-64 flex-shrink-0 h-screen bg-ink flex flex-col border-r border-ink-border">
      <div className="p-5 flex flex-col flex-1">
        <Link to="/" onClick={closeAllMenus} className="flex items-center gap-3 mb-8 px-1">
          <div className="bg-accent rounded-xl p-2 shadow-lg shadow-accent/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Legends Admin</span>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Dashboard</p>
          </div>
        </Link>

        <nav className="space-y-0.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isDropdown && 'subItems' in item) {
              const isOpen = openDropdown === item.label;
              const isSectionActive =
                item.label === 'Audience' ? isAudienceActive : item.label === 'App Settings' ? isAppSettingsActive : false;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.label)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isSectionActive
                        ? 'bg-ink-light text-white'
                        : 'text-zinc-400 hover:bg-ink-light hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-ink-border pl-3">
                      {item.subItems.map((subItem) => {
                        if ('path' in subItem) {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => {
                                setOpenDropdown(item.label);
                                setOpenSubDropdown(null);
                              }}
                              className={linkClass(isActive(subItem.path))}
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
                              type="button"
                              onClick={() => toggleSubDropdown(subItem.label)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isHomeActive ? 'bg-ink-light text-white' : 'text-zinc-400 hover:bg-ink-light hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                {subItem.label}
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSubOpen && (
                              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-ink-muted pl-2">
                                {subItem.subItems.map((link) => {
                                  const LinkIcon = link.icon;
                                  return (
                                    <Link
                                      key={link.path}
                                      to={link.path}
                                      onClick={() => {
                                        setOpenDropdown('App Settings');
                                        setOpenSubDropdown('Home');
                                      }}
                                      className={linkClass(isActive(link.path))}
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
                onClick={closeAllMenus}
                className={linkClass(isActive(item.path))}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-ink-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm text-zinc-500 hover:bg-ink-light hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
