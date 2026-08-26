import { Link, useLocation } from "wouter";
import { Home, Percent, ShoppingCart, User, LayoutDashboard, ScanLine, Truck } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
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
    <nav aria-label="التنقل الرئيسي" className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-2 right-2 z-50 pointer-events-none">
      <div className="floating-nav mx-auto max-w-lg pointer-events-auto">
        <div className="flex items-end justify-around gap-1 px-1 py-1.5 sm:gap-2 sm:px-2">
          {tabs.map((tab) => {
            const isActive = location === tab.path || location.startsWith(tab.path + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                aria-label={tab.name}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => preloadPage(tab.path)}
                onTouchStart={() => preloadPage(tab.path)}
                className={"relative flex min-h-14 flex-1 max-w-[5rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 group outline-none transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background " + (isActive ? "floating-nav-item-active" : "floating-nav-item")}
              >
                <div className="relative">
                  <Icon
                    aria-hidden="true"
                    className={"w-6 h-6 transition-colors duration-300 " + (isActive ? "text-white" : "text-primary group-hover:text-primary")}
                  />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <div aria-label={tab.badge + " عناصر في السلة"} className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full neon-green">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </div>
                  )}
                </div>
                <span className={"text-[10px] font-medium transition-colors duration-300 " + (isActive ? "text-white font-bold" : "text-muted-foreground group-hover:text-primary")}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
