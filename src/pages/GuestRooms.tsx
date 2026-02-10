import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bed, Users } from 'lucide-react';
import { GuestBookingDialog } from '@/components/GuestBookingDialog';
import { RoomScheduleDialog } from '@/components/RoomScheduleDialog';
import { useReservations } from '@/context/ReservationContext';


// Helper to get image based on room type
// Image pools for different room types
const roomImages: Record<string, string[]> = {
    'Suite': [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1631049307264-da0f29722e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Bedroom
    ],
    'Executive': [
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80", // Bedroom
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1474&q=80"  // Bedroom
    ],
    'Deluxe': [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1512918760530-772713840870?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Bedroom
    ],
    'Family': [
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80", // Bedroom
        "https://images.unsplash.com/photo-1576675784201-0e142b423d6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Bedroom
    ],
    'Standard': [
        "https://images.unsplash.com/photo-1631049307264-da0f29722e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1474&q=80", // Bedroom
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Bedroom
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Bedroom
    ],
    'Economy': [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Cozy bedroom
        "https://images.unsplash.com/photo-1631049307264-da0f29722e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Simple bedroom
    ],
    'Double': [
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Double Beds
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Modern Bedroom
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Cozy Room
    ],
    'Single': [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", // Cozy small bedroom
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"  // Simple hotel room
    ]
};

const getRoomImage = (type: string, roomId: number) => {
    // Default to Standard pool if type not found
    const pool = roomImages[type] || roomImages['Standard'];
    // Deterministic selection based on room ID
    // Using a prime multiplier to reduce pattern visibility for sequential IDs
    const index = (roomId * 7) % pool.length;
    return pool[index];
};

const getRoomCapacity = (type: string) => {
    switch (type) {
        case 'Single': return 1;
        case 'Double': return 2;
        case 'Family': return 4;
        case 'Suite': return 4;
        default: return 2;
    }
};

export default function GuestRooms() {
    const { rooms, checkAvailability } = useReservations();
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    // Enrich rooms with their type details
    const displayRooms = rooms.map(room => {
        const type = room.roomType;
        const isAvailable = checkIn && checkOut
            ? checkAvailability(room.Room_ID, checkIn, checkOut)
            : room.Status === 'Available';

        return {
            ...room,
            typeName: type?.Type_Name || 'Standard',
            price: type?.Base_Rate || 0,
            image: getRoomImage(type?.Type_Name || '', room.Room_ID),
            capacity: getRoomCapacity(type?.Type_Name || ''),
            isBookable: isAvailable && room.Status !== 'Maintenance'
        };
    });

    return (
        <div className="container mx-auto py-8 animate-fade-in">
            <PageHeader
                title="Our Rooms"
                description="Find your perfect sanctuary."
            />

            {/* Global Date Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-border mt-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Check Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Check-In Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Check-Out Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRooms.map((room) => (
                    <Card key={room.Room_ID} className="overflow-hidden group h-full flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={room.image}
                                alt={room.typeName}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${room.isBookable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {room.isBookable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Room {room.Room_Number}</CardTitle>
                                    <CardDescription>{room.typeName}</CardDescription>
                                </div>
                                <span className="font-semibold text-lg text-primary">
                                    ₱{room.price.toLocaleString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{room.capacity} Guests</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bed className="h-4 w-4" />
                                    <span>{room.typeName === 'Single' ? 'Single Bed' : 'King/Queen Bed'}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Mock amenities based on type */}
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Wifi</span>
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">AC</span>
                                {room.price > 2000 && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">TV</span>}
                                {room.price > 4000 && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Minibar</span>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            {room.isBookable ? (
                                <div className="w-full space-y-2">
                                    <RoomScheduleDialog roomId={room.Room_ID} roomName={`Room ${room.Room_Number}`} />
                                    <GuestBookingDialog
                                        roomName={`Room ${room.Room_Number} - ${room.typeName}`}
                                        price={room.price}
                                        roomID={room.Room_ID}
                                        initialCheckIn={checkIn}
                                        initialCheckOut={checkOut}
                                    />
                                </div>
                            ) : (
                                <div className="w-full space-y-2">
                                    <RoomScheduleDialog roomId={room.Room_ID} roomName={`Room ${room.Room_Number}`} />
                                    <button disabled className="w-full py-2 bg-muted text-muted-foreground rounded-md cursor-not-allowed">
                                        {room.Status === 'Maintenance' ? 'Under Maintenance' : 'Unavailable for Dates'}
                                    </button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {displayRooms.length === 0 && (
                <div className="text-center py-12">
                    <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No rooms found in the system.</p>
                </div>
            )}
        </div>
    );
}
