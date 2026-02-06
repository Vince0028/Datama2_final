import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useReservations } from "@/context/ReservationContext";
import { Calendar as CalendarIcon } from "lucide-react";

interface RoomScheduleDialogProps {
    roomId: number;
    roomName: string;
}

export function RoomScheduleDialog({ roomId, roomName }: RoomScheduleDialogProps) {
    const { reservations } = useReservations();
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Calculate disabled dates (booked dates)
    const bookedDays = useMemo(() => {
        const days: Date[] = [];

        reservations.forEach(res => {
            if (res.Room_ID === roomId && (res.Status === 'Booked' || res.Status === 'CheckedIn')) {
                let current = new Date(res.Check_In);
                const end = new Date(res.Check_Out);

                // Add all days from check-in to check-out (exclusive of checkout day usually, but let's be safe)
                while (current < end) {
                    days.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
            }
        });
        return days;
    }, [reservations, roomId]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    View Schedule
                </Button>
            </DialogTrigger>
            <DialogContent className="w-auto p-0">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle>Availability Schedule</DialogTitle>
                    <DialogDescription>
                        Booked dates for {roomName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 flex flex-col items-center gap-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={bookedDays}
                        modifiers={{ booked: bookedDays }}
                        modifiersStyles={{
                            booked: {
                                backgroundColor: "#ef4444", // red-500
                                color: "white",
                                opacity: 1,
                                textDecoration: "none",
                                borderRadius: "4px"
                            }
                        }}
                        className="rounded-md border shadow"
                    />
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500"></div>
                            <span>Booked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-200 bg-transparent"></div>
                            <span>Available</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
