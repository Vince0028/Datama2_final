import { useState } from 'react';
import { Plus, Calendar, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useReservations } from '@/context/ReservationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Reservations() {
  const { reservations, updateStatus } = useReservations();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleApprove = (id: number) => {
    updateStatus(id, 'Booked');
  };

  const handleReject = (id: number) => {
    updateStatus(id, 'Cancelled');
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = (
      res.room?.Room_Number?.includes(searchTerm) ||
      res.guests?.some(g => g.guest?.First_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.guest?.Last_Name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (activeTab === "pending") return matchesSearch && res.Status === "Pending";
    if (activeTab === "active") return matchesSearch && (res.Status === "Booked" || res.Status === "CheckedIn");
    return matchesSearch;
  }).sort((a, b) => new Date(b.Check_In).getTime() - new Date(a.Check_In).getTime());

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reservations"
        description="Manage bookings and approvals"
        action={
          <Button className="gap-2" onClick={() => toast.info("Create feature disabled in demo")}>
            <Plus className="h-4 w-4" />
            New Reservation
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs defaultValue="all" className="w-full md:w-[400px]" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
              {reservations.filter(r => r.Status === 'Pending').length > 0 && (
                <span className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {reservations.filter(r => r.Status === 'Pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests or rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-[300px]"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Guest</TableHead>
              <TableHead className="font-semibold">Room</TableHead>
              <TableHead className="font-semibold">Dates</TableHead>
              <TableHead className="font-semibold">Staff</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.map((reservation) => {
              const primaryGuest = reservation.guests?.find(g => g.Guest_Type === 'Primary');
              return (
                <TableRow key={reservation.Reservation_ID} className="animate-fade-in">
                  <TableCell className="font-mono text-sm">#{reservation.Reservation_ID}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {primaryGuest?.guest
                        ? `${primaryGuest.guest.First_Name} ${primaryGuest.guest.Last_Name}`
                        : 'Unknown'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                        {reservation.room?.Room_Number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reservation.room?.roomType?.Type_Name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {reservation.Check_In} <span className="text-muted-foreground">to</span> {reservation.Check_Out}
                  </TableCell>
                  <TableCell>
                    {reservation.staff ? (
                      <span className="text-sm">{reservation.staff.First_Name}</span>
                    ) : (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full flex items-center w-fit gap-1">
                        <Clock className="h-3 w-3" /> Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={reservation.Status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {reservation.Status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprove(reservation.Reservation_ID)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleReject(reservation.Reservation_ID)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No reservations found.
        </div>
      )}
    </div>
  );
}
