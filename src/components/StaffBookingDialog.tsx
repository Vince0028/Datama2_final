
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useReservations } from "@/context/ReservationContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export function StaffBookingDialog() {
    const { addWalkInReservation, rooms, checkAvailability, refreshData } = useReservations();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    // Form State
    const [guestFirstName, setGuestFirstName] = useState("");
    const [guestLastName, setGuestLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshData();
            toast.success("Rooms refreshed");
        } catch (error) {
            // Error handled in context
        } finally {
            setIsRefreshing(false);
        }
    };


    useEffect(() => {
        // Clear selected room if it's no longer available for new dates
        if (selectedRoomId) {
            const room = rooms.find(r => r.Room_ID.toString() === selectedRoomId);
            const isAvailable = room && checkIn && checkOut && checkAvailability(room.Room_ID, checkIn, checkOut) && room.Status !== 'Maintenance';

            if (!isAvailable) {
                setSelectedRoomId("");
            }
        }
    }, [checkIn, checkOut, rooms, checkAvailability, selectedRoomId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[StaffBookingDialog] handleSubmit called');

        if (!selectedRoomId) {
            toast.error("Please select a room");
            return;
        }

        setIsSubmitting(true);
        console.log('[StaffBookingDialog] Calling addWalkInReservation with:', {
            roomId: parseInt(selectedRoomId),
            staffId: user?.Staff_ID,
            checkIn,
            checkOut,
            guestFirstName,
            guestLastName,
            guestEmail: email,
            guestPhone: phone,
            paymentMethod,
        });

        try {
            await addWalkInReservation({
                roomId: parseInt(selectedRoomId),
                staffId: user?.Staff_ID || 0,
                checkIn,
                checkOut,
                guestFirstName,
                guestLastName,
                guestEmail: email,
                guestPhone: phone,
                paymentMethod,
            });
            console.log('[StaffBookingDialog] addWalkInReservation succeeded');

            setOpen(false);
            // Reset form
            setCheckIn("");
            setCheckOut("");
            setGuestFirstName("");
            setGuestLastName("");
            setEmail("");
            setPhone("");
            setSelectedRoomId("");
            setPaymentMethod("Cash");

        } catch (error) {
            console.error('[StaffBookingDialog] Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Reservation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Walk-in Reservation</DialogTitle>
                    <DialogDescription>
                        Create a new reservation for a walk-in guest.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                required
                                placeholder="Jane"
                                value={guestFirstName}
                                onChange={(e) => setGuestFirstName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                required
                                placeholder="Doe"
                                value={guestLastName}
                                onChange={(e) => setGuestLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="jane@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                required
                                placeholder="0912 345 6789"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="checkIn">Check-in</Label>
                            <Input
                                id="checkIn"
                                type="date"
                                required
                                value={checkIn}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                onChange={(e) => setCheckIn(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="checkOut">Check-out</Label>
                            <Input
                                id="checkOut"
                                type="date"
                                required
                                value={checkOut}
                                min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                                onChange={(e) => setCheckOut(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="room">Room</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                className="h-6 px-2 text-muted-foreground hover:text-foreground"
                                title="Refresh rooms"
                            >
                                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                            <SelectTrigger disabled={!checkIn || !checkOut}>
                                <SelectValue placeholder={(!checkIn || !checkOut) ? "Select dates first" : "Select a room"} />
                            </SelectTrigger>
                            <SelectContent>
                                {rooms.length === 0 ? (
                                    <SelectItem value="none" disabled>No rooms found</SelectItem>
                                ) : (
                                    rooms.map((room) => {
                                        const isMaintenance = room.Status === 'Maintenance';
                                        const isDateAvailable = checkIn && checkOut ? checkAvailability(room.Room_ID, checkIn, checkOut) : false;
                                        const isAvailable = !isMaintenance && isDateAvailable;

                                        return (
                                            <SelectItem
                                                key={room.Room_ID}
                                                value={room.Room_ID.toString()}
                                                disabled={!isAvailable}
                                                className={!isAvailable ? "opacity-50" : ""}
                                            >
                                                Room {room.Room_Number} - {room.roomType?.Type_Name} (₱{room.roomType?.Base_Rate})
                                                {isMaintenance ? " (Maintenance)" : !isDateAvailable ? " (Unavailable)" : ""}
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="GCash">GCash</SelectItem>
                                <SelectItem value="PayPal">PayPal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Reservation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
