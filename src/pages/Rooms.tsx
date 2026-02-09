import { useState } from 'react';
import { Bed, Filter, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useReservations } from '@/context/ReservationContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Room } from '@/types/hotel';

type FilterStatus = 'All' | 'Available' | 'Occupied' | 'Maintenance';
type FilterType = 'All' | string;

export default function Rooms() {
  const { user } = useAuth();
  const { rooms, updateRoomStatus, refreshData } = useReservations();

  const isReadOnly = user?.staffData?.Role === 'ReservationAgent';
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [typeFilter, setTypeFilter] = useState<FilterType>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real data from context
  const enrichedRooms = rooms;

  const filteredRooms = enrichedRooms.filter(room => {
    if (statusFilter !== 'All' && room.Status !== statusFilter) return false;
    if (typeFilter !== 'All' && room.roomType.Type_Name !== typeFilter) return false;
    return true;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const statusColors = {
    Available: 'border-green-200 bg-green-50',
    Occupied: 'border-red-200 bg-red-50',
    Maintenance: 'border-amber-200 bg-amber-50',
  };

  const handleStatusChange = (roomId: number, value: string) => {
    updateRoomStatus(roomId, value as Room['Status']);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Room Administration"
        description="Manage hotel inventory and status"
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {(['All', 'Available', 'Occupied', 'Maintenance'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Type:</span>
          <Button
            variant={typeFilter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('All')}
          >
            All
          </Button>
          {(Array.from(new Set(rooms.map(r => r.roomType?.Type_Name).filter(Boolean))) as string[]).map((typeName) => (
            <Button
              key={typeName}
              variant={typeFilter === typeName ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(typeName)}
            >
              {typeName}
            </Button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room, index) => (
          <div
            key={room.Room_ID}
            className={cn(
              "relative rounded-xl border-2 p-6 transition-all duration-300 hover-lift animate-slide-up",
              statusColors[room.Status]
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bed className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">
                    Room {room.Room_Number}
                  </h3>
                  <p className="text-sm text-muted-foreground">{room.roomType.Type_Name}</p>
                </div>
              </div>
              <StatusBadge status={room.Status} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Rate</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(room.roomType.Base_Rate)}/night
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Room ID</span>
                <span className="font-mono text-foreground">{room.Room_ID}</span>
              </div>
            </div>

            {/* Status Control */}
            <div className="pt-4 border-t border-border/50">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Update Status
              </label>
              <Select
                value={room.Status}
                onValueChange={(value) => handleStatusChange(room.Room_ID, value)}
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      {
        filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No rooms match your filters</p>
          </div>
        )
      }
    </div >
  );
}
