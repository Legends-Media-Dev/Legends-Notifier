import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Boxes,
  FolderOpen,
  Package,
  Percent,
  RotateCcw,
  ShoppingCart,
  Users,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import OverviewTab from '../components/shopify/OverviewTab';
import SalesReportingTab from '../components/shopify/SalesReportingTab';
import OrdersTab from '../components/shopify/OrdersTab';
import ProductsTab from '../components/shopify/ProductsTab';
import InventoryTab from '../components/shopify/InventoryTab';
import CollectionsTab from '../components/shopify/CollectionsTab';
import CustomersTab from '../components/shopify/CustomersTab';
import DiscountsTab from '../components/shopify/DiscountsTab';
import CheckoutsTab from '../components/shopify/CheckoutsTab';
import RefundsTab from '../components/shopify/RefundsTab';

type ShopifyTab =
  | 'overview'
  | 'sales'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'collections'
  | 'customers'
  | 'discounts'
  | 'checkouts'
  | 'refunds';

const TABS: {
  id: ShopifyTab;
  label: string;
  path: string;
  icon: typeof BarChart3;
}[] = [
  { id: 'overview', label: 'Overview', path: '/shopify/overview', icon: Activity },
  { id: 'sales', label: 'Sales', path: '/shopify/sales', icon: BarChart3 },
  { id: 'orders', label: 'Orders', path: '/shopify/orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', path: '/shopify/products', icon: Package },
  { id: 'inventory', label: 'Inventory', path: '/shopify/inventory', icon: Boxes },
  { id: 'collections', label: 'Collections', path: '/shopify/collections', icon: FolderOpen },
  { id: 'customers', label: 'Customers', path: '/shopify/customers', icon: Users },
  { id: 'discounts', label: 'Discounts', path: '/shopify/discounts', icon: Percent },
  { id: 'checkouts', label: 'Checkouts', path: '/shopify/checkouts', icon: ShoppingCart },
  { id: 'refunds', label: 'Refunds', path: '/shopify/refunds', icon: RotateCcw },
];

const Shopify = () => {
  const { tab } = useParams<{ tab?: string }>();

  const activeTab = useMemo<ShopifyTab | null>(() => {
    if (!tab) return null;
    if (tab === 'reporting') return 'sales';
    if (TABS.some((t) => t.id === tab)) return tab as ShopifyTab;
    return null;
  }, [tab]);

  if (!tab || !activeTab) {
    return <Navigate to="/shopify/overview" replace />;
  }

  return (
    <PageLayout
      title="Shopify"
      description="Internal store insights for sales, catalog, customers, and support assistance"
    >
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-ink-light'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'sales' && <SalesReportingTab />}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'collections' && <CollectionsTab />}
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'discounts' && <DiscountsTab />}
      {activeTab === 'checkouts' && <CheckoutsTab />}
      {activeTab === 'refunds' && <RefundsTab />}
    </PageLayout>
  );
};

export default Shopify;
