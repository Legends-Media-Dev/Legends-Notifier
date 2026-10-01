import {
  CircleDollarSign,
  Info,
  Loader2,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { CampaignAttributionResponse } from '../lib/api';

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface CampaignImpactSummaryProps {
  data: CampaignAttributionResponse | null;
  loading: boolean;
}

const CampaignImpactSummary = ({ data, loading }: CampaignImpactSummaryProps) => {
  if (loading) {
    return (
      <div className="page-card mb-6 p-6 flex items-center justify-center min-h-[150px]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!data || data.campaigns.length === 0) return null;

  const totalRevenue = data.campaigns.reduce(
    (sum, campaign) => sum + campaign.mobileAppRevenue,
    0
  );
  const totalOrders = data.campaigns.reduce(
    (sum, campaign) => sum + campaign.mobileAppOrders,
    0
  );
  const campaignsWithSales = data.campaigns.filter(
    (campaign) => campaign.mobileAppOrders > 0
  ).length;
  const topCampaign = [...data.campaigns].sort(
    (a, b) => b.mobileAppRevenue - a.mobileAppRevenue
  )[0];

  return (
    <section className="page-card mb-6 overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-accent-light/90 via-white to-violet-50 border-b border-accent/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="section-icon !w-10 !h-10 shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Push notification impact</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-white border border-accent/20 rounded-full px-2 py-0.5">
                  Last {data.lookbackDays} days
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Mobile app sales observed in the {data.attributionWindowHours} hours after each push.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 border border-gray-100 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 text-accent shrink-0" />
            Last-touch reporting prevents the same order from being counted twice.
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <CircleDollarSign className="w-4 h-4 text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">App revenue after push</p>
          </div>
          <p className="text-2xl font-bold text-ink tabular-nums">
            {formatCurrency(totalRevenue, data.currency)}
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Mobile app orders</p>
          </div>
          <p className="text-2xl font-bold text-ink tabular-nums">
            {new Intl.NumberFormat('en-US').format(totalOrders)}
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Revenue-driving pushes</p>
          </div>
          <p className="text-2xl font-bold text-ink tabular-nums">
            {campaignsWithSales}
            <span className="text-sm font-medium text-gray-400"> / {data.campaigns.length}</span>
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Top campaign</p>
          </div>
          <p className="text-sm font-semibold text-ink line-clamp-1">{topCampaign.title}</p>
          <p className="text-sm font-bold text-accent mt-1 tabular-nums">
            {formatCurrency(topCampaign.mobileAppRevenue, data.currency)}
          </p>
        </div>
      </div>

      {data.truncated && (
        <div className="px-6 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
          Shopify returned the maximum number of order pages, so these totals may be understated.
        </div>
      )}
    </section>
  );
};

export default CampaignImpactSummary;
