import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Segments from './pages/Segments';
import Giveaway from './pages/Giveaway';
import NewNotification from './pages/NewNotification';
import ShopCollections from './pages/ShopCollections';
import GiveawaySnippet from './pages/GiveawaySnippet';
import CategorySnippet from './pages/CategorySnippet';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="h-screen flex bg-gray-50 overflow-hidden">
                  <Navbar />
                  <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/segments" element={<Segments />} />
                      <Route path="/giveaway" element={<Giveaway />} />
                      <Route path="/new-notification" element={<NewNotification />} />
                      <Route path="/app-settings/shop-collections" element={<ShopCollections />} />
                      <Route path="/app-settings/home/giveaway-snippet" element={<GiveawaySnippet />} />
                      <Route path="/app-settings/home/category-snippet" element={<CategorySnippet />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

