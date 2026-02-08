import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReservationProvider } from "@/context/ReservationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GuestLayout } from "./components/layout/GuestLayout";
import { StaffLayout } from "./components/layout/StaffLayout";

// Guest Pages
import GuestDashboard from "./pages/GuestDashboard";
import GuestRooms from "./pages/GuestRooms";

// Auth Pages
import Login from "./pages/Login";
import GuestSignup from "./pages/GuestSignup";
import StaffLogin from "./pages/StaffLogin";
import Debug from "./pages/Debug";

// Staff Pages
import StaffDashboard from "./pages/StaffDashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Guests from "./pages/Guests";
import StaffReports from "./pages/StaffReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component for Staff
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.User_Type !== 'Staff') {
    return <Navigate to="/staff-login" replace />;
  }

  return <StaffLayout>{children}</StaffLayout>;
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Guest Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<GuestSignup />} />

      {/* Staff Auth Route */}
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/test-debug" element={<Debug />} />

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

      {/* Staff Routes (Protected) */}
      <Route path="/staff/dashboard" element={
        <StaffRoute>
          <StaffDashboard />
        </StaffRoute>
      } />
      <Route path="/staff/rooms" element={
        <StaffRoute>
          <Rooms />
        </StaffRoute>
      } />
      <Route path="/staff/reservations" element={
        <StaffRoute>
          <Reservations />
        </StaffRoute>
      } />
      <Route path="/staff/guests" element={
        <StaffRoute>
          <Guests />
        </StaffRoute>
      } />
      <Route path="/staff/reports" element={
        <StaffRoute>
          <StaffReports />
        </StaffRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ReservationProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ReservationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

