import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="glass sticky top-0 z-30 border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="bg-apple-blue rounded-xl p-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-semibold text-gray-900">Legends Notifier</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-2 sm:px-4 py-2 rounded-lg transition-all font-medium text-sm sm:text-base ${
                isActive('/')
                  ? 'text-apple-blue underline decoration-2 underline-offset-4'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/users"
              className={`px-2 sm:px-4 py-2 rounded-lg transition-all font-medium text-sm sm:text-base ${
                isActive('/users')
                  ? 'text-apple-blue underline decoration-2 underline-offset-4'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Users
            </Link>
            <Link
              to="/new-notification"
              className={`px-2 sm:px-4 py-2 rounded-lg transition-all font-medium text-sm sm:text-base ${
                isActive('/new-notification')
                  ? 'text-apple-blue underline decoration-2 underline-offset-4'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <span className="hidden sm:inline">New Notification</span>
              <span className="sm:hidden">New</span>
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 px-2 sm:px-4 py-2 rounded-lg transition-all font-medium text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 flex items-center gap-1 sm:gap-2"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

