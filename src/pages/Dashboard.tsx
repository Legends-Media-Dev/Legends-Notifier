import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Megaphone,
  Users,
  ShoppingBag,
  Store,
  Send,
  ChevronRight,
  Loader2,
  Zap,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { fetchDashboardStats, DashboardStats } from '../lib/api';
import {
  getDashboardCache,
  isDashboardCacheFresh,
  formatCacheAge,
  type DashboardPeriod,
} from '../lib/dashboardCache';
import { formatDate } from '../lib/utils';
import { getStatusConfig, formatUserGroup } from '../lib/notificationUtils';

type PeriodRange = 'current_month' | '7' | '30' | '90' | 'lifetime';
type ChartTab = 'revenue' | 'orders' | 'push';

const PERIOD_OPTIONS: { value: PeriodRange; label: string }[] = [
  { value: 'current_month', label: 'Current month' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'lifetime', label: 'Lifetime' },
];

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function ChangeBadge({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

function PushKpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="page-card px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="section-icon !w-8 !h-8 shrink-0">
            <Icon className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
              {label}
            </p>
            {sub && (
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{sub}</p>
            )}
          </div>
        </div>
        <p className="text-xl font-bold text-ink tabular-nums shrink-0">{value}</p>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodRange>('current_month');
  const [chartTab, setChartTab] = useState<ChartTab>('revenue');
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const [showMobileApp, setShowMobileApp] = useState(true);
  const [showOther, setShowOther] = useState(true);

  const load = useCallback(async (forceRefresh = false) => {
    const periodKey = period as DashboardPeriod;

    if (!forceRefresh) {
      const cached = getDashboardCache(periodKey);
      if (cached && isDashboardCacheFresh(cached.fetchedAt)) {
        setData(cached.data);
        setLastFetchedAt(cached.fetchedAt);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }
    }

    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const stats = await fetchDashboardStats({ period: periodKey, forceRefresh });
      setData(stats);
      setLastFetchedAt(Date.now());
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const hasRevenue = data.chart.some((b) => b.totalRevenue > 0);
    setChartTab(hasRevenue ? 'revenue' : 'push');
  }, [data?.period.label, data?.sales.source]);

  const chartMax = useMemo(() => {
    if (!data?.chart.length) return 1;
    return Math.max(
      ...data.chart.map((b) => {
        if (chartTab === 'push') return b.pushRecipients;
        if (chartTab === 'revenue') {
          const mobile = showMobileApp ? b.mobileAppRevenue : 0;
          const other = showOther ? b.otherRevenue : 0;
          return mobile + other;
        }
        const mobile = showMobileApp ? b.mobileAppOrders : 0;
        const other = showOther ? b.otherOrders : 0;
        return mobile + other;
      }),
      1
    );
  }, [data, chartTab, showMobileApp, showOther]);

  const hasPeriodSales =
    data?.sales.source === 'orders' && data.chart.some((b) => b.totalRevenue > 0);

  const currency = data?.sales.currency ?? 'USD';

  const headerActions = (
    <div className="flex items-center gap-3">
      {lastFetchedAt && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          Updated {formatCacheAge(lastFetchedAt)}
        </span>
      )}
      <div className="flex items-center gap-2">
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as PeriodRange)}
        className="select-field min-w-[9.75rem]"
      >
        {PERIOD_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => load(true)}
        disabled={refreshing}
        className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center shrink-0"
        aria-label="Refresh dashboard data"
        title="Refresh dashboard data"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
      </div>
    </div>
  );

  if (loading && !data) {
    return (
      <PageLayout title="Dashboard" description="Overview of your mobile app performance">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error && !data) {
    return (
      <PageLayout title="Dashboard" description="Overview of your mobile app performance" actions={headerActions}>
        <div className="page-card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button type="button" onClick={() => load()} className="btn-primary">
            Retry
          </button>
        </div>
      </PageLayout>
    );
  }

  if (!data) return null;

  return (
    <PageLayout
      title="Dashboard"
      description="Overview of your mobile app performance"
      actions={headerActions}
    >
      <div className="space-y-6 w-full">
        {/* Value prop banner */}
        <div className="page-card p-5 bg-gradient-to-r from-accent-light/80 via-white to-violet-50 border-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="section-icon">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-ink">Legends Mobile App Impact</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatNumber(data.app.totalUsers)} push-enabled devices ·{' '}
                  {formatNumber(data.app.totalRecipientsInPeriod)} push recipients in{' '}
                  {data.period.label.toLowerCase()} ·{' '}
                  {data.sales.mobileAppShare}% of all store sales from the mobile app channel
                </p>
              </div>
            </div>
            <Link to="/campaigns" className="btn-primary shrink-0 inline-flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Manage campaigns
            </Link>
          </div>
        </div>

        {data.sales.notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {data.sales.notice}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <p>
            <span className="font-medium text-ink">Summary cards</span> reflect{' '}
            <span className="font-medium text-ink">{data.period.dateRangeLabel}</span>
            {data.period.comparisonLabel && (
              <> — compared to {data.period.comparisonLabel}</>
            )}
            . <span className="font-medium text-ink">Charts</span> show{' '}
            {data.chartPeriod.label.toLowerCase()} ({data.chartPeriod.dateRangeLabel}) by month.
          </p>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              icon: Smartphone,
              label: 'App users',
              value: formatNumber(data.app.totalUsers),
              sub: `${formatNumber(data.app.usersWithEmail)} with email`,
            },
            {
              icon: Send,
              label: 'Push reach',
              value: formatNumber(data.app.totalRecipientsInPeriod),
              sub: `${data.app.sendEventsInPeriod} sends in period`,
            },
            {
              icon: Megaphone,
              label: 'Campaigns',
              value: formatNumber(data.app.sentCampaignCount),
              sub: `${data.app.scheduledCount} scheduled · ${data.app.draftCount} drafts`,
            },
            {
              icon: ShoppingBag,
              label: 'Mobile App Orders',
              value: formatNumber(data.sales.mobileAppOrders),
              sub: `${formatCurrency(data.sales.mobileAppRevenue, currency)} · ${data.period.label}`,
            },
            {
              icon: LayoutDashboard,
              label: 'Total Orders',
              value: formatNumber(data.sales.totalOrders),
              sub: `${formatCurrency(data.sales.totalRevenue, currency)} · ${data.period.label}`,
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="page-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="section-icon !w-9 !h-9">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Sales performance — Omnisend-style split layout */}
        <div className="grid xl:grid-cols-[minmax(300px,380px)_1fr] gap-6">
          {/* Left summary column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <PushKpiCard
                label="Push reach"
                value={formatNumber(data.app.totalRecipientsInPeriod)}
                sub="Recipients"
                icon={Send}
              />
              <PushKpiCard
                label="Sends"
                value={formatNumber(data.app.sendEventsInPeriod)}
                sub="Campaigns"
                icon={Megaphone}
              />
            </div>

            <div className="page-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Mobile app sales
                </span>
              </div>
              <p className="text-sm font-medium text-ink mb-4">{data.salesChannel}</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-ink">
                  {formatCurrency(data.sales.mobileAppRevenue, currency)}
                </span>
                <ChangeBadge value={data.sales.mobileAppRevenueChange} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formatNumber(data.sales.mobileAppOrders)} orders · {data.sales.mobileAppShare}% of
                all store sales
              </p>
              <p className="text-xs text-gray-400 mt-2">{data.period.dateRangeLabel}</p>
            </div>

            <div className="page-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Store sales
                </span>
              </div>
              <p className="text-sm font-medium text-ink mb-4">Legends Media</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-ink">
                  {formatCurrency(data.sales.totalRevenue, currency)}
                </span>
                <ChangeBadge value={data.sales.revenueChange} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formatNumber(data.sales.totalOrders)} orders · all sales channels
              </p>
              <p className="text-xs text-gray-400 mt-2">{data.period.dateRangeLabel}</p>
              {data.sales.ordersTruncated && (
                <p className="text-xs text-amber-600 mt-2">
                  Large order volume — chart may reflect a subset of orders.
                </p>
              )}
            </div>

            <Link
              to="/users"
              className="flex items-center justify-between page-card p-4 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-ink">View app audience</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors" />
            </Link>
          </div>

          {/* Right chart column */}
          <div className="page-card p-6 flex flex-col min-h-[420px]">
            <div className="mb-4">
              <h3 className="font-semibold text-ink">Trends</h3>
              <p className="text-sm text-gray-500">
                {data.chartPeriod.label} · monthly · {data.chartPeriod.dateRangeLabel}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex rounded-xl bg-surface-muted p-1 flex-wrap">
                {(
                  [
                    ...(hasPeriodSales
                      ? ([['revenue', 'Revenue'], ['orders', 'Orders']] as const)
                      : []),
                    ['push', 'Push reach'],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setChartTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      chartTab === tab
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-gray-500 hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {chartTab !== 'push' && (
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMobileApp}
                    onChange={(e) => setShowMobileApp(e.target.checked)}
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
                    Mobile app channel
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOther}
                    onChange={(e) => setShowOther(e.target.checked)}
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-200" />
                    All other channels
                  </span>
                </label>
              </div>
              )}
            </div>

            {data.chart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No data for this period
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-end gap-2 sm:gap-3 min-h-[280px] pb-2">
                  {data.chart.map((bucket) => {
                    if (chartTab === 'push') {
                      const total = bucket.pushRecipients;
                      const heightPct = (total / chartMax) * 100;
                      return (
                        <div
                          key={bucket.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          <div
                            className="w-full max-w-[48px] rounded-t-md bg-accent transition-all duration-300"
                            style={{ height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%` }}
                            title={`${bucket.label}: ${formatNumber(total)} recipients`}
                          />
                          <span className="text-[10px] sm:text-xs text-gray-400 mt-2 truncate w-full text-center">
                            {bucket.label}
                          </span>
                        </div>
                      );
                    }

                    const mobileVal =
                      chartTab === 'revenue' ? bucket.mobileAppRevenue : bucket.mobileAppOrders;
                    const otherVal =
                      chartTab === 'revenue' ? bucket.otherRevenue : bucket.otherOrders;
                    const total = (showMobileApp ? mobileVal : 0) + (showOther ? otherVal : 0);
                    const heightPct = (total / chartMax) * 100;

                    const mobilePct = total > 0 && showMobileApp ? (mobileVal / total) * 100 : 0;
                    const otherPct = total > 0 && showOther ? (otherVal / total) * 100 : 0;

                    return (
                      <div
                        key={bucket.date}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <div
                          className="w-full max-w-[48px] flex flex-col justify-end rounded-t-md overflow-hidden transition-all duration-300"
                          style={{ height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%` }}
                          title={
                            chartTab === 'revenue'
                              ? `${bucket.label}: ${formatCurrency(total, currency)}`
                              : `${bucket.label}: ${formatNumber(total)} orders`
                          }
                        >
                          {showOther && otherPct > 0 && (
                            <div
                              className="w-full bg-violet-200 transition-all"
                              style={{ flex: otherPct }}
                            />
                          )}
                          {showMobileApp && mobilePct > 0 && (
                            <div
                              className="w-full bg-accent transition-all"
                              style={{ flex: mobilePct }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-400 mt-2 truncate w-full text-center">
                          {bucket.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {chartTab === 'push'
                      ? 'Push recipients'
                      : chartTab === 'revenue'
                        ? 'Revenue'
                        : 'Orders'}{' '}
                    by month
                  </span>
                  {data.chart.some((b) => b.pushRecipients > 0) && (
                    <span>
                      Max push reach in a bucket:{' '}
                      {formatNumber(Math.max(...data.chart.map((b) => b.pushRecipients)))}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="page-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">Recent campaigns</h3>
              <p className="text-sm text-gray-500">Latest push notification activity</p>
            </div>
            <Link to="/campaigns" className="text-sm font-medium text-accent hover:text-accent-hover">
              View all
            </Link>
          </div>
          {data.recentCampaigns.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No campaigns yet.{' '}
              <Link to="/campaigns" className="text-accent hover:underline">
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentCampaigns.map((campaign) => {
                const statusCfg = getStatusConfig(campaign.status);
                return (
                  <div
                    key={campaign.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{campaign.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {campaign.lastSentAt
                          ? `Sent ${formatDate(campaign.lastSentAt)}`
                          : 'Not sent yet'}
                        {campaign.userGroup && ` · ${formatUserGroup(campaign.userGroup)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-gray-500 hidden sm:inline">
                        {formatNumber(campaign.recipientCount)} recipients
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
