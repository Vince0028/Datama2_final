
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
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { CitySelect } from "@/components/CitySelect";

export function StaffBookingDialog() {
    const { addWalkInReservation, rooms, checkAvailability, refreshData } = useReservations();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    // Form State
    const [guestFirstName, setGuestFirstName] = useState("");
    const [guestMiddleName, setGuestMiddleName] = useState("");
    const [guestLastName, setGuestLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const LIMITS = { firstName: 50, middleName: 50, lastName: 50, email: 100, address: 150, city: 50, postalCode: 4, phone: 13 };

    // Auto-capitalize each word: "vince nelmar" → "Vince Nelmar", "VINCE" → "Vince"
    const toTitleCase = (str: string) =>
        str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    const charHint = (limit: number, value: string) => {
        const remaining = limit - value.length;
        if (remaining <= Math.ceil(limit * 0.2) && remaining > 0) return <p className="text-xs text-amber-500 mt-0.5">{remaining} characters left</p>;
        if (remaining <= 0) return <p className="text-xs text-destructive mt-0.5">Character limit reached</p>;
        return null;
    };

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

        if (guestFirstName.trim().length < 2 || guestLastName.trim().length < 2) {
            toast.error("First and last name must be at least 2 characters");
            return;
        }

        if (!phone.trim() || !/^(09[0-9]{9}|639[0-9]{9})$/.test(phone.trim())) {
            toast.error("Enter a valid PH phone number (e.g. 09123456789 or 639123456789)");
            return;
        }

        if (postalCode.trim() && !/^[1-9][0-9]{3}$/.test(postalCode.trim())) {
            toast.error("Postal code must be 4 digits (1000–9999)");
            return;
        }

        setIsSubmitting(true);
        console.log('[StaffBookingDialog] Calling addWalkInReservation with:', {
            roomId: parseInt(selectedRoomId),
            staffId: user?.Staff_ID,
            checkIn,
            checkOut,
            guestFirstName,
            guestMiddleName,
            guestLastName,
            guestEmail: email,
            guestPhone: parseInt(phone, 10),
            paymentMethod,
        });

        try {
            await addWalkInReservation({
                roomId: parseInt(selectedRoomId),
                staffId: user?.Staff_ID || 0,
                checkIn,
                checkOut,
                guestFirstName: guestFirstName.trim(),
                guestMiddleName: guestMiddleName.trim(),
                guestLastName: guestLastName.trim(),
                guestEmail: email.trim(),
                guestPhone: parseInt(phone.trim(), 10),
                guestAddress: address.trim(),
                guestCity: city.trim(),
                guestPostalCode: postalCode.trim() ? parseInt(postalCode.trim(), 10) : undefined,
                paymentMethod,
            });
            console.log('[StaffBookingDialog] addWalkInReservation succeeded');

            setOpen(false);
            // Reset form
            setCheckIn("");
            setCheckOut("");
            setGuestFirstName("");
            setGuestMiddleName("");
            setGuestLastName("");
            setEmail("");
            setPhone("");
            setAddress("");
            setCity("");
            setPostalCode("");
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                                maxLength={LIMITS.firstName}
                                value={guestFirstName}
                                onChange={(e) => setGuestFirstName(toTitleCase(e.target.value.replace(/[^A-Za-z\s\-''.]/g, '').slice(0, LIMITS.firstName)))}
                            />
                            {charHint(LIMITS.firstName, guestFirstName)}
                            {guestFirstName.length === 1 && (
                                <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                    <AlertCircle className="h-3 w-3" /> Minimum 2 characters required
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="middleName">Middle Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                            <Input
                                id="middleName"
                                placeholder="A."
                                maxLength={LIMITS.middleName}
                                value={guestMiddleName}
                                onChange={(e) => setGuestMiddleName(toTitleCase(e.target.value.replace(/[^A-Za-z\s\-''.]/g, '').slice(0, LIMITS.middleName)))}
                            />
                            {charHint(LIMITS.middleName, guestMiddleName)}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                required
                                placeholder="Doe"
                                maxLength={LIMITS.lastName}
                                value={guestLastName}
                                onChange={(e) => setGuestLastName(toTitleCase(e.target.value.replace(/[^A-Za-z\s\-''.]/g, '').slice(0, LIMITS.lastName)))}
                            />
                            {charHint(LIMITS.lastName, guestLastName)}
                            {guestLastName.length === 1 && (
                                <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                    <AlertCircle className="h-3 w-3" /> Minimum 2 characters required
                                </p>
                            )}
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
                                maxLength={LIMITS.email}
                                value={email}
                                onChange={(e) => setEmail(e.target.value.replace(/\s/g, '').slice(0, LIMITS.email))}
                            />
                            {charHint(LIMITS.email, email)}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                required
                                placeholder="09123456789"
                                maxLength={LIMITS.phone}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, LIMITS.phone))}
                            />
                            {phone && !/^(09[0-9]{9}|639[0-9]{9})$/.test(phone) && (
                                <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                    <AlertCircle className="h-3 w-3" /> Format: 09XXXXXXXXX or 639XXXXXXXXX
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            placeholder="123 Main Street"
                            maxLength={LIMITS.address}
                            value={address}
                            onChange={(e) => setAddress(toTitleCase(e.target.value.slice(0, LIMITS.address)))}
                        />
                        {charHint(LIMITS.address, address)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <CitySelect
                                value={city}
                                onChange={setCity}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                                id="postalCode"
                                placeholder="1000"
                                maxLength={LIMITS.postalCode}
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, '').slice(0, LIMITS.postalCode))}
                            />
                            {postalCode && !/^[1-9][0-9]{3}$/.test(postalCode) && (
                                <p className="text-xs text-amber-500 mt-0.5">Must be 4 digits (1000–9999)</p>
                            )}
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
