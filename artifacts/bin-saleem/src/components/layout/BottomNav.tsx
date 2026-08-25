import { Link, useLocation } from "wouter";
import { Home, Percent, ShoppingCart, User, LayoutDashboard, ScanLine, Truck } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;

          return (
            <Link key={tab.path} href={tab.path} className="relative w-full flex flex-col items-center gap-1 group">
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
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
                    className="absolute -inset-2 bg-primary/20 rounded-full -z-10 blur-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  isActive ? "text-primary text-neon-blue" : "text-muted-foreground group-hover:text-primary/70"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
