import { cn } from '@/lib/utils';
const statusConfig = {
    // Room statuses
    Available: { label: 'Available', className: 'status-available' },
    Occupied: { label: 'Occupied', className: 'status-occupied' },
    Maintenance: { label: 'Maintenance', className: 'status-maintenance' },
    // Reservation statuses
    Booked: { label: 'Booked', className: 'status-booked' },
    CheckedIn: { label: 'Checked In', className: 'status-checkedin' },
    CheckedOut: { label: 'Checked Out', className: 'status-checkedout' },
    Cancelled: { label: 'Cancelled', className: 'status-cancelled' },
    // Payment statuses
    Paid: { label: 'Paid', className: 'status-checkedin' },
    Pending: { label: 'Pending', className: 'status-maintenance' },
};
export function StatusBadge({ status, className }) {
    const config = statusConfig[status];
    return (<span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>);
}
