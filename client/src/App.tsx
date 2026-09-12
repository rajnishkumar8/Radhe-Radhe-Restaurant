import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import DriverPortal from "./pages/driver/DriverPortal";
import AdminPortal from "./pages/admin/AdminPortal";
import CustomerProfile from "./pages/CustomerProfile";
import CelebratePage from "./pages/Celebrate";
import NotFound from "./pages/NotFound";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" as const } },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/" component={() => <AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/menu" component={() => <AnimatedPage><Menu /></AnimatedPage>} />
        <Route path="/checkout" component={() => <AnimatedPage><Checkout /></AnimatedPage>} />
        <Route path="/profile" component={() => <AnimatedPage><CustomerProfile /></AnimatedPage>} />
        <Route path="/celebrate" component={() => <AnimatedPage><CelebratePage /></AnimatedPage>} />
        <Route path="/order-confirmation/:id" component={() => <AnimatedPage><OrderConfirmation /></AnimatedPage>} />
        <Route path="/track/:id" component={() => <AnimatedPage><TrackOrder /></AnimatedPage>} />
        <Route path="/driver" component={() => <AnimatedPage><DriverPortal /></AnimatedPage>} />
        <Route path="/admin" component={() => <AnimatedPage><AdminPortal /></AnimatedPage>} />
        <Route path="/operations" component={() => <AnimatedPage><AdminPortal /></AnimatedPage>} />
        <Route path="/manage" component={() => <AnimatedPage><AdminPortal /></AnimatedPage>} />
        <Route path="/404" component={() => <AnimatedPage><NotFound /></AnimatedPage>} />
        <Route component={() => <AnimatedPage><NotFound /></AnimatedPage>} />
      </Switch>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
