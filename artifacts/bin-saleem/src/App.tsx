import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { pages } from "./routes/lazyPages";

const { Login, Home, Offers, Cart, Profile, Admin, DataEntry, Representative, NotFound } = {
  Login: pages.login,
  Home: pages.home,
  Offers: pages.offers,
  Cart: pages.cart,
  Profile: pages.profile,
  Admin: pages.admin,
  DataEntry: pages.dataEntry,
  Representative: pages.representative,
  NotFound: pages.notFound,
};

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to the correct home based on role
    if (role === "ADMIN") return <Redirect to="/admin" />;
    if (role === "DATA_ENTRY") return <Redirect to="/data-entry" />;
    if (role === "REPRESENTATIVE") return <Redirect to="/representative" />;
    return <Redirect to="/home" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/home" component={() => <ProtectedRoute component={Home} />} />
        <Route path="/offers" component={() => <ProtectedRoute component={Offers} />} />
        <Route path="/cart" component={() => <ProtectedRoute component={Cart} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route path="/admin" component={() => <ProtectedRoute component={Admin} allowedRoles={["ADMIN"]} />} />
        <Route path="/data-entry" component={() => <ProtectedRoute component={DataEntry} allowedRoles={["DATA_ENTRY", "ADMIN"]} />} />
        <Route path="/representative" component={() => <ProtectedRoute component={Representative} allowedRoles={["REPRESENTATIVE", "ADMIN"]} />} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
