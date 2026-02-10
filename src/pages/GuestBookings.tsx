import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rawQuery } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CreditCard } from 'lucide-react';

// Format ID with leading zeros (e.g., 1 → 001)
const formatId = (id: number, digits = 3) => String(id).padStart(digits, '0');

interface Booking {
  reservation_id: number;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  payment_method: string | null;
  room: {
    room_number: string;
    roomtype: {
      type_name: string;
    };
  };
}

export default function GuestBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.Guest_ID) {
        setLoading(false);
        return;
      }

      try {
        // Get fresh token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        // Get reservation IDs for this guest
        const { data: resGuests, error: rgError } = await rawQuery('reservationguest', {
          filters: `guest_id=eq.${user.Guest_ID}`,
          token,
        });

        if (rgError || !resGuests?.length) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const reservationIds = resGuests.map((rg: any) => rg.reservation_id);

        // Get reservations
        const { data: reservations, error: resError } = await rawQuery('reservation', {
          filters: `reservation_id=in.(${reservationIds.join(',')})`,
          order: 'created_at.desc',
          token,
        });

        if (resError) throw resError;

        // Get rooms, room types, and payments
        const { data: rooms } = await rawQuery('room', { token });
        const { data: roomTypes } = await rawQuery('roomtype', { token });
        const { data: paymentsData } = await rawQuery('payment', {
          filters: `reservation_id=in.(${reservationIds.join(',')})`,
          token,
        });

        // Join the data
        const enrichedBookings = (reservations || []).map((res: any) => {
          const room = rooms?.find((r: any) => r.room_id === res.room_id);
          const roomType = room ? roomTypes?.find((rt: any) => rt.roomtype_id === room.roomtype_id) : null;
          const payment = paymentsData?.find((p: any) => p.reservation_id === res.reservation_id);
          return {
            ...res,
            payment_method: payment?.method || null,
            room: {
              room_number: room?.room_number || 'N/A',
              roomtype: {
                type_name: roomType?.type_name || 'Unknown',
              },
            },
          };
        });

        setBookings(enrichedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.Guest_ID]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Booked': return 'bg-blue-100 text-blue-800';
      case 'CheckedIn': return 'bg-green-100 text-green-800';
      case 'CheckedOut': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">You don't have any bookings yet.</p>
            <a href="/guest/rooms" className="text-primary hover:underline mt-2 inline-block">
              Browse available rooms →
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.reservation_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Room {booking.room.room_number} - {booking.room.roomtype.type_name}
                  </CardTitle>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{formatDate(booking.check_in)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{formatDate(booking.check_out)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">₱{booking.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  {booking.payment_method && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <p className="font-medium">{booking.payment_method}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
