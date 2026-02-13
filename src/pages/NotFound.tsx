import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <h1 className="text-6xl font-display font-bold text-accent mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Button asChild>
        <Link to="/" className="gap-2">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
