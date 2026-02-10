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

    // Calculate booked/checked-in days (red) and pending days (yellow)
    const { bookedDays, pendingDays } = useMemo(() => {
        const booked: Date[] = [];
        const pending: Date[] = [];

        reservations.forEach(res => {
            if (res.Room_ID !== roomId) return;
            if (res.Status === 'Cancelled' || res.Status === 'CheckedOut') return;

            const isActive = res.Status === 'Booked' || res.Status === 'CheckedIn';
            const isPending = res.Status === 'Pending';
            if (!isActive && !isPending) return;

            let current = new Date(res.Check_In);
            current.setHours(0, 0, 0, 0);
            const end = new Date(res.Check_Out);
            end.setHours(0, 0, 0, 0);

            while (current < end) {
                if (isActive) booked.push(new Date(current));
                else if (isPending) pending.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        });
        return { bookedDays: booked, pendingDays: pending };
    }, [reservations, roomId]);

    const allDisabled = [...bookedDays, ...pendingDays];

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
                    <DialogTitle>Room Schedule</DialogTitle>
                    <DialogDescription>
                        Booking schedule for {roomName}
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 flex flex-col items-center gap-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={allDisabled}
                        modifiers={{ booked: bookedDays, pending: pendingDays }}
                        modifiersStyles={{
                            booked: {
                                background: "linear-gradient(135deg, #dc2626, #ef4444)",
                                color: "white",
                                opacity: 1,
                                textDecoration: "none",
                                borderRadius: "4px",
                                fontWeight: "bold"
                            },
                            pending: {
                                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                                color: "white",
                                opacity: 1,
                                textDecoration: "none",
                                borderRadius: "4px",
                                fontWeight: "bold"
                            }
                        }}
                        className="rounded-md border shadow"
                    />
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}></div>
                            <span>Booked / Checked In</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}></div>
                            <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-gray-200 bg-white"></div>
                            <span>Available</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
