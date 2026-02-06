import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReservationProvider } from "@/context/ReservationContext";
import { GuestLayout } from "./components/layout/GuestLayout";
import { StaffLayout } from "./components/layout/StaffLayout";

// Guest Pages
import GuestDashboard from "./pages/GuestDashboard";
import GuestRooms from "./pages/GuestRooms";

// Staff Pages
import StaffDashboard from "./pages/StaffDashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Guests from "./pages/Guests";
import StaffReports from "./pages/StaffReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ReservationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Guest Routes */}
            <Route path="/" element={
              <GuestLayout>
                <GuestDashboard />
              </GuestLayout>
            } />
            <Route path="/guest/rooms" element={
              <GuestLayout>
                <GuestRooms />
              </GuestLayout>
            } />
            <Route path="/guest/booking" element={
              <GuestLayout>
                <div className="container py-8 text-center">
                  <h1 className="text-2xl font-bold">My Bookings</h1>
                  <p className="text-muted-foreground mt-2">Feature coming soon.</p>
                </div>
              </GuestLayout>
            } />

            {/* Staff Routes */}
            <Route path="/staff/dashboard" element={
              <StaffLayout>
                <StaffDashboard />
              </StaffLayout>
            } />
            <Route path="/staff/rooms" element={
              <StaffLayout>
                <Rooms />
              </StaffLayout>
            } />
            <Route path="/staff/reservations" element={
              <StaffLayout>
                <Reservations />
              </StaffLayout>
            } />
            <Route path="/staff/guests" element={
              <StaffLayout>
                <Guests />
              </StaffLayout>
            } />
            <Route path="/staff/reports" element={
              <StaffLayout>
                <StaffReports />
              </StaffLayout>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ReservationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
