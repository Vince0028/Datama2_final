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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "@/context/ReservationContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface GuestBookingDialogProps {
    roomName: string;
    price: number;
    roomID: number;
    initialCheckIn?: string;
    initialCheckOut?: string;
}

export function GuestBookingDialog({ roomName, price, roomID, initialCheckIn, initialCheckOut }: GuestBookingDialogProps) {
    const navigate = useNavigate();
    const { addReservation } = useReservations();
    const { user, isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [checkIn, setCheckIn] = useState(initialCheckIn || "");
    const [checkOut, setCheckOut] = useState(initialCheckOut || "");

    // Sync state with props when dialog opens or props change
    useEffect(() => {
        if (open) {
            if (initialCheckIn) setCheckIn(initialCheckIn);
            if (initialCheckOut) setCheckOut(initialCheckOut);
        }
    }, [open, initialCheckIn, initialCheckOut]);

    // Auto-fill guest info from logged-in user
    const [guestName, setGuestName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-fill form with user data when dialog opens
    useEffect(() => {
        if (open && user?.guestData) {
            setGuestName(`${user.guestData.First_Name} ${user.guestData.Last_Name}`);
            setEmail(user.guestData.Email);
        }
    }, [open, user]);

    const handleBookClick = () => {
        // Check if user is authenticated before allowing booking
        if (!isAuthenticated || user?.User_Type !== 'Guest') {
            toast.error("Please sign in to book a room");
            navigate('/login');
            return;
        }
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const [firstName, ...lastNameParts] = guestName.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            await addReservation({
                Room_ID: roomID,
                Staff_ID: 0,
                Check_In: checkIn,
                Check_Out: checkOut,
                Status: 'Pending',
                guest: {
                    First_Name: firstName,
                    Last_Name: lastName,
                    Email: email
                }
            });

            setOpen(false);
            setCheckIn("");
            setCheckOut("");
            setGuestName("");
            setEmail("");
        } catch (error) {
            // Error handling is done in context, but we catching here to stop spinner
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button className="w-full" onClick={handleBookClick}>
                Book Now
            </Button>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book {roomName}</DialogTitle>
                    <DialogDescription>
                        Enter your details to request a reservation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            required
                            placeholder="John Doe"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="checkIn">Check-in</Label>
                            <Input
                                id="checkIn"
                                type="date"
                                required
                                value={checkIn}
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
                                onChange={(e) => setCheckOut(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending Request..." : "Confirm Booking"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

