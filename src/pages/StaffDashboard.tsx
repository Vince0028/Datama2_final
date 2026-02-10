import { DollarSign, Calendar, Bed, Clock, TrendingUp, CreditCard, Banknote, Globe, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useReservations } from '@/context/ReservationContext';
import { useAuth } from '@/context/AuthContext';

export default function StaffDashboard() {
    const { metrics, reservations, paymentBreakdown, resetData } = useReservations();
    const { user } = useAuth();

    // Get recent reservations
    const recentReservations = reservations
        .slice(-5)
        .reverse();

    // Use real payment data from context (safely handle undefined)
    const revenueByMethod = paymentBreakdown && paymentBreakdown.length > 0
        ? paymentBreakdown
        : [{ method: 'No payments yet', amount: 0 }];

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    const methodIcons: Record<string, typeof CreditCard> = {
        Card: CreditCard,
        Cash: Banknote,
        Online: Globe,
        GCash: Smartphone,
        PayPal: Globe,
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <PageHeader
                    title="Staff Dashboard"
                    description="Hotel Operations & Revenue Overview"
                />

                {/* Reset Data Button - Managers Only */}
                {user?.staffData?.Role === 'Manager' && (
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset all system data? This will clear all reservations and guests.')) {
                                resetData();
                            }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                        Reset System Data
                    </button>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(metrics.totalRevenue)}
                    icon={<DollarSign className="h-6 w-6" />}
                    variant="primary"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Active Reservations"
                    value={metrics.activeReservations}
                    subtitle="Coming/In-house"
                    icon={<Calendar className="h-6 w-6" />}
                />
                <StatCard
                    title="Available Rooms"
                    value={metrics.availableRooms}
                    subtitle="Ready for booking"
                    icon={<Bed className="h-6 w-6" />}
                />
                <StatCard
                    title="Average Stay"
                    value={`${metrics.averageStay.toFixed(1)} nights`}
                    icon={<Clock className="h-6 w-6" />}
                    variant="accent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-card rounded-xl shadow-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-display font-semibold text-foreground">
                            Recent Reservations
                        </h2>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-4">
                        {recentReservations.map((reservation, index) => {
                            const primaryGuest = reservation.guests?.find(g => g.Guest_Type === 'Primary');
                            return (
                                <div
                                    key={reservation.Reservation_ID}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                                            {reservation.room?.Room_Number || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {primaryGuest?.guest
                                                    ? `${primaryGuest.guest.First_Name} ${primaryGuest.guest.Last_Name}`
                                                    : 'Unknown Guest'
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {reservation.room?.roomType?.Type_Name} • {reservation.Check_In} to {reservation.Check_Out}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-foreground">
                                            {formatCurrency(reservation.Total_Amount)}
                                        </span>
                                        <StatusBadge status={reservation.Status} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue by Payment Method */}
                <div className="bg-card rounded-xl shadow-card p-6">
                    <h2 className="text-lg font-display font-semibold text-foreground mb-6">
                        Revenue by Payment Method
                    </h2>
                    <div className="space-y-4">
                        {revenueByMethod.map((item, index) => {
                            const Icon = methodIcons[item.method] || CreditCard;
                            const total = revenueByMethod.reduce((sum, i) => sum + i.amount, 0);
                            const percentage = total > 0 ? Math.round((item.amount / total) * 100) : 0;

                            return (
                                <div
                                    key={item.method}
                                    className="animate-slide-up"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-foreground">{item.method}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full gradient-accent rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-sm font-medium text-foreground mt-1">
                                        {formatCurrency(item.amount)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
