import { Link, useLocation } from "wouter";
import { Home, Percent, ShoppingCart, User, LayoutDashboard, ScanLine, Truck } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { preloadPage } from "../../routes/lazyPages";

export function BottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { role } = useAuth();

  type Tab = { name: string; path: string; icon: React.ElementType; badge?: number };

  let tabs: Tab[] = [];

  if (role === "ADMIN") {
    tabs = [
      { name: "الرئيسية", path: "/home", icon: Home },
      { name: "منتجات", path: "/data-entry", icon: ScanLine },
      { name: "الطلبات", path: "/representative", icon: Truck },
      { name: "تحكم", path: "/admin", icon: LayoutDashboard },
      { name: "حسابي", path: "/profile", icon: User },
    ];
  } else if (role === "DATA_ENTRY") {
    tabs = [
      { name: "الرئيسية", path: "/home", icon: Home },
      { name: "إضافة", path: "/data-entry", icon: ScanLine },
      { name: "حسابي", path: "/profile", icon: User },
    ];
  } else if (role === "REPRESENTATIVE") {
    tabs = [
      { name: "الرئيسية", path: "/home", icon: Home },
      { name: "الطلبات", path: "/representative", icon: Truck },
      { name: "حسابي", path: "/profile", icon: User },
    ];
  } else {
    tabs = [
      { name: "الرئيسية", path: "/home", icon: Home },
      { name: "العروض", path: "/offers", icon: Percent },
      { name: "السلة", path: "/cart", icon: ShoppingCart, badge: totalItems },
      { name: "حسابي", path: "/profile", icon: User },
    ];
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 pointer-events-none">
      <div className="floating-nav mx-auto max-w-md rounded-[28px] p-2 pointer-events-auto">
        <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              onMouseEnter={() => preloadPage(tab.path)}
              onTouchStart={() => preloadPage(tab.path)}
              className="relative w-full flex flex-col items-center gap-1 group"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full neon-green">
                    {tab.badge}
                  </div>
                )}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -inset-2 bg-secondary/25 rounded-full -z-10 blur-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-primary"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}
