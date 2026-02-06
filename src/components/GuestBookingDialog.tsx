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
import { useReservations } from "@/context/ReservationContext";

interface GuestBookingDialogProps {
    roomName: string;
    price: number;
    roomID: number;
    initialCheckIn?: string;
    initialCheckOut?: string;
}

export function GuestBookingDialog({ roomName, price, roomID, initialCheckIn, initialCheckOut }: GuestBookingDialogProps) {
    const { addReservation } = useReservations();
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

    const [guestName, setGuestName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            const [firstName, ...lastNameParts] = guestName.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            addReservation({
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

            setIsSubmitting(false);
            setOpen(false);
            setCheckIn("");
            setCheckOut("");
            setGuestName("");
            setEmail("");
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">Book Now</Button>
            </DialogTrigger>
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
