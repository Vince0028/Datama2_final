import { useState } from 'react';
import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { useReservations } from '@/context/ReservationContext';

export default function Guests() {
  const { reservations } = useReservations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);

  // Derive unique guests from reservations
  const uniqueGuests = Array.from(new Map(
    reservations
      .flatMap(r => r.guests)
      .filter(g => g?.guest)
      .map(g => [g!.guest.Guest_ID, g!.guest])
  ).values());

  const filteredGuests = uniqueGuests.filter(guest => {
    const fullName = `${guest.First_Name} ${guest.Last_Name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      (guest.Phone && guest.Phone.includes(searchTerm)) ||
      (guest.Email && guest.Email.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getGuestHistory = (guestId: number) => {
    return reservations.filter(r =>
      r.guests.some(g => g.guest.Guest_ID === guestId)
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const selectedGuest = uniqueGuests.find(g => g.Guest_ID === selectedGuestId);
  const guestHistory = selectedGuestId ? getGuestHistory(selectedGuestId) : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Guest Directory"
        description="View and search all registered guests"
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Guest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest, index) => {
          const reservationCount = reservations.filter(r => r.guests.some(g => g.guest.Guest_ID === guest.Guest_ID)).length;

          return (
            <Dialog key={guest.Guest_ID}>
              <DialogTrigger asChild>
                <div
                  className="bg-card rounded-xl shadow-card p-6 cursor-pointer transition-all duration-300 hover-lift animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedGuestId(guest.Guest_ID)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-display font-bold text-lg">
                      {guest.First_Name[0]}{guest.Last_Name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">
                        {guest.First_Name} {guest.Last_Name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{guest.Phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{guest.Email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{guest.City || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Guest ID: {guest.Guest_ID}</span>
                    <span className="text-xs font-medium text-accent">
                      {reservationCount} reservation{reservationCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                      {guest.First_Name[0]}{guest.Last_Name[0]}
                    </div>
                    {guest.First_Name} {guest.Last_Name}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {/* Guest Details */}
                  {selectedGuest && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedGuest.Phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedGuest.Email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedGuest.Address || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="font-medium">{selectedGuest.City || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Reservation History */}
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-4">
                      Reservation History
                    </h4>
                    {guestHistory.length > 0 ? (
                      <div className="space-y-3">
                        {guestHistory.map((reservation) => (
                          <div
                            key={reservation.Reservation_ID}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                          >
                            <div>
                              <p className="font-medium">
                                Room {reservation.room?.Room_Number} - {reservation.room?.roomType?.Type_Name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reservation.Check_In} to {reservation.Check_Out}
                              </p>
                              {reservation.payment?.Method && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Paid via {reservation.payment.Method}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(reservation.Total_Amount)}</p>
                              <StatusBadge status={reservation.Status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No reservation history</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No guests found</p>
        </div>
      )}
    </div>
  );
}
