import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Users from './pages/Users';
import Segments from './pages/Segments';
import Giveaway from './pages/Giveaway';
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
                <div className="h-screen flex bg-surface overflow-hidden">
                  <Navbar />
                  <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/campaigns" element={<Campaigns />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/segments" element={<Segments />} />
                      <Route path="/giveaway" element={<Giveaway />} />
                      <Route path="/new-notification" element={<Navigate to="/campaigns" replace />} />
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
