import { useEffect, useState, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useClinicTheme } from "./hooks/useClinicTheme";
import MyBlogList from "./components/MyBlogList";
import {
  Calendar,
  FileText,
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Bell,
  LayoutDashboard,
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  ArrowRightLeft,
  Building2,
  Menu,
  X,
} from "lucide-react";

import {
  SidebarProvider,
  SidebarInset,
} from "./components/ui/sidebar";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { DashboardHeader } from "./components/DashboardHeader";
import { AppointmentsList } from "./components/AppointmentsList";
import { PatientRecords } from "./components/PatientRecords";
import EPrescription from "./components/EPrescription";
import { ProductivityCharts } from "./components/ProductivityCharts";
import { Marketplace } from "./components/Marketplace";
import { AlertsPanel } from "./components/AlertsPanel";
import BlogList from "./components/BlogList";
import CreateBlog from "./components/CreateBlog";
import BlogDetail from "./components/BlogDetail";
import CBCTViewerPage from "./components/CBCTViewerPage";
import DentalChartGlobalPreloader from "./components/DentalChartGlobalPreloader";
import DoctorLogin from "./components/DoctorLogin";
import { useToast } from "./hooks/useToast";
import ToastProvider  from "./components/ToastProvider";

const MAIN_APP_ORIGIN = "http://localhost:3000";
const NOTIFICATION_SERVICE_URL = "http://localhost:8011";
const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ROLE: "userRole",
  DOCTOR_ID: "doctorId",
  CLINIC_ID: "clinicId",
  ACTIVE_MODE: "activeMode",
  IS_HYBRID: "isHybrid",
} as const;

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

interface MenuItem {
  path?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
  onClick?: () => void;
  showInClinicMode?: boolean;
}

interface AuthState {
  token: string | null;
  role: string | null;
  doctorId: string | null;
  clinicId: string | null;
  isHybrid: boolean;
  activeMode: 'doctor' | 'clinic';
}

const isValidDoctorId = (id: any): id is string => {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  return trimmed !== "" && trimmed !== "undefined" && trimmed !== "null";
};

const getStorageValue = (key: string): string | null => {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

const setStorageValue = (key: string, value: string, persistent = false) => {
  sessionStorage.setItem(key, value);
  if (persistent) {
    localStorage.setItem(key, value);
  }
};

const clearStorage = () => {
  sessionStorage.clear();
  localStorage.clear();
};

const removeStorageKey = (key: string) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

const clearAllAuthData = () => {
  removeStorageKey(STORAGE_KEYS.AUTH_TOKEN);
  removeStorageKey(STORAGE_KEYS.USER_ROLE);
  removeStorageKey(STORAGE_KEYS.DOCTOR_ID);
  removeStorageKey(STORAGE_KEYS.CLINIC_ID);
  removeStorageKey(STORAGE_KEYS.ACTIVE_MODE);
  removeStorageKey(STORAGE_KEYS.IS_HYBRID);
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    doctorId: null,
    clinicId: null,
    isHybrid: false,
    activeMode: 'doctor',
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  const handleAuthUpdate = useCallback(
    (
      token: string,
      role: string,
      doctorId?: string,
      clinicId?: string,
      persistent = false,
      isHybrid = false,
    ) => {
      console.log("🔐 Auth update:", { token, role, doctorId, clinicId, persistent, isHybrid });

      clearAllAuthData;

      setStorageValue(STORAGE_KEYS.AUTH_TOKEN, token, persistent);
      setStorageValue(STORAGE_KEYS.USER_ROLE, role, persistent);
      setStorageValue(STORAGE_KEYS.IS_HYBRID, String(isHybrid), persistent);

      if (isValidDoctorId(doctorId)) {
        setStorageValue(STORAGE_KEYS.DOCTOR_ID, doctorId, persistent);
      }

      if (clinicId) {
        setStorageValue(STORAGE_KEYS.CLINIC_ID, clinicId, persistent);
      }

      setStorageValue(STORAGE_KEYS.ACTIVE_MODE, 'doctor', persistent);

      setAuthState({
        token,
        role,
        doctorId: isValidDoctorId(doctorId) ? doctorId : null,
        clinicId: clinicId || null,
        isHybrid,
        activeMode: 'doctor',
      });
      
      toast.showSuccess(`Welcome back! Logged in as ${role === "760" ? "Hybrid" : role === "600" ? "Doctor" : "User"}`);
      setIsInitialized(true);
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 0);
    },
    [navigate],
  );

  // Initialize auth state
  useEffect(() => {
    console.log("🩺 Doctor Portal initializing...");

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MAIN_APP_ORIGIN) return;
      console.log("📨 Message received:", event.data);
      const { type, token, role, doctorId, clinicId, isHybrid } = event.data || {};
      if (type !== "LOGIN_DATA" || !token || !role) return;
      toast.showInfo("Authenticating from main app...");
      handleAuthUpdate(token, role, doctorId, clinicId, false, isHybrid === true);
    };

    window.addEventListener("message", handleMessage);

    // Check URL params first
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const urlDoctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");
    const isHybrid = params.get("isHybrid") === "true" || params.get("role") === "760";

    console.log("🔍 URL params:", { token, role, urlDoctorId, clinicId, isHybrid });

    if (token && role) {
      console.log("✅ Found URL params, authenticating...");
      toast.showInfo("Authenticating with provided credentials...");
      
      clearAllAuthData();
      
      handleAuthUpdate(
        token,
        role,
        urlDoctorId || undefined,
        clinicId || undefined,
        true,
        isHybrid,
      );
      
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsInitialized(true);
      return;
    }

    // Check for stored token
    const storedToken = getStorageValue(STORAGE_KEYS.AUTH_TOKEN);
    
    if (storedToken) {
      console.log("🔍 Found stored token");
      
      if (isTokenExpired(storedToken)) {
        console.log("⏰ Stored token is expired, clearing auth data...");
        clearAllAuthData();
        setIsInitialized(true);
        return;
      }
      
      const storedRole = getStorageValue(STORAGE_KEYS.USER_ROLE);
      const storedDoctorId = getStorageValue(STORAGE_KEYS.DOCTOR_ID);
      const storedClinicId = getStorageValue(STORAGE_KEYS.CLINIC_ID);
      const storedIsHybrid = getStorageValue(STORAGE_KEYS.IS_HYBRID);
      const storedActiveMode = getStorageValue(STORAGE_KEYS.ACTIVE_MODE) as 'doctor' | 'clinic' | null;

      console.log("💾 Stored values:", {
        storedToken,
        storedRole,
        storedDoctorId,
        storedClinicId,
        storedIsHybrid,
        storedActiveMode
      });

      if (storedToken && storedRole) {
        const isUserHybrid = storedIsHybrid === 'true' || storedRole === "760";
        
        setAuthState({
          token: storedToken,
          role: storedRole,
          doctorId: isValidDoctorId(storedDoctorId) ? storedDoctorId : null,
          clinicId: storedClinicId || null,
          isHybrid: isUserHybrid,
          activeMode: storedActiveMode === 'clinic' ? 'clinic' : 'doctor',
        });

        if (storedDoctorId && !isValidDoctorId(storedDoctorId)) {
          removeStorageKey(STORAGE_KEYS.DOCTOR_ID);
        }
      }
    } else {
      console.log("🔍 No stored token found");
      clearAllAuthData();
    }
    
    setIsInitialized(true);

    return () => window.removeEventListener("message", handleMessage);
  }, [handleAuthUpdate]);

  // Handle URL params on location change (but prevent infinite loops)
  useEffect(() => {
    // Only run if we're not already initialized with a token from URL params
    if (!authState.token) {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const role = params.get("role");
      const urlDoctorId = params.get("doctorId");
      const clinicId = params.get("clinicId");
      const isHybrid = params.get("isHybrid") === "true" || role === "760";

      if (token && role) {
        handleAuthUpdate(
          token,
          role,
          urlDoctorId || undefined,
          clinicId || undefined,
          true,
          isHybrid,
        );
      }
    }
  }, [location.search, handleAuthUpdate, authState.token]);

  // Theme
  const clinicIdFromStorage = getStorageValue(STORAGE_KEYS.CLINIC_ID);
  useClinicTheme(clinicIdFromStorage || "");

  const handleLogout = useCallback(() => {
    console.log("🚪 Logging out...");
    toast.showInfo("Logging out...");
    
    clearAllAuthData();
    
    setAuthState({
      token: null,
      role: null,
      doctorId: null,
      clinicId: null,
      isHybrid: false,
      activeMode: 'doctor',
    });
    
    setNotifications([]);
    setUnreadCount(0);
    
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleToggleMode = useCallback(() => {
    if (!authState.isHybrid) return;
    
    const newMode = authState.activeMode === 'doctor' ? 'clinic' : 'doctor';
    console.log("🔄 Toggling mode:", { current: authState.activeMode, new: newMode });
    
    toast.showInfo(`Switching to ${newMode} mode...`);
    setStorageValue(STORAGE_KEYS.ACTIVE_MODE, newMode, true);
    
    setAuthState(prev => ({
      ...prev,
      activeMode: newMode
    }));
    
    if (newMode === 'clinic') {
      if (authState.clinicId && authState.doctorId && authState.token) {
        const clinicDashboardUrl = `http://localhost:3000/dashboard/${authState.clinicId}`;
        const redirectURL = `${clinicDashboardUrl}?token=${encodeURIComponent(authState.token)}&role=${authState.role}&doctorId=${authState.doctorId}&clinicId=${authState.clinicId}&isHybrid=true&mode=clinic`;
        console.log("➡️ Redirecting to clinic dashboard:", redirectURL);
        toast.showSuccess("Redirecting to clinic dashboard...");
        window.location.href = redirectURL;
      } else {
        console.error("❌ Missing clinicId or doctorId for clinic mode", {
          clinicId: authState.clinicId,
          doctorId: authState.doctorId,
          token: authState.token
        });
      }
    }
  }, [authState]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { path: "/dashboard", title: "Overview", icon: LayoutDashboard, showInClinicMode: false },
      { path: "/appointments", title: "Appointments", icon: Calendar, showInClinicMode: true },
      { path: "/patients", title: "Patients", icon: FileText, showInClinicMode: true },
      {
        path: "/alerts",
        title: "Alerts",
        icon: Bell,
        showBadge: true,
        showInClinicMode: true,
      },
      { path: "/analytics", title: "Analytics", icon: TrendingUp, showInClinicMode: true },
      { path: "/blog", title: "Blog", icon: BookOpen, showInClinicMode: false },
    ];

    if (authState.role === "600") {
      items.push({
        path: "/marketplace",
        title: "Market",
        icon: ShoppingBag,
        showInClinicMode: true,
      });
    }

    return items;
  }, [authState.role]);
  
  const filteredMenuItems = useMemo(() => {
    if (authState.activeMode === 'doctor') {
      return menuItems;
    } else {
      return menuItems.filter(item => item.showInClinicMode !== false);
    }
  }, [menuItems, authState.activeMode]);

  const handleNotificationsUpdate = useCallback(
    (data: Notification[], count: number) => {
      setNotifications(data);
      setUnreadCount(count);
    },
    [],
  );

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Doctor Portal...</p>
        </div>
      </div>
    );
  }

  if (authState.token) {
    console.log("📊 Current auth state:", {
      role: authState.role,
      isHybrid: authState.isHybrid,
      activeMode: authState.activeMode,
      clinicId: authState.clinicId,
      doctorId: authState.doctorId,
      path: location.pathname
    });
  }

  const isLoginPage = location.pathname === "/login";

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-primary">Doctor Portal</h2>
            <p className="text-xs text-muted-foreground">
              {authState.activeMode === 'doctor' ? 'Doctor Mode' : 'Clinic Mode'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mode Toggle for Hybrid Users */}
          {authState.isHybrid && (
            <button
              onClick={handleToggleMode}
              className="p-2 rounded-lg hover:bg-muted"
              title={authState.activeMode === 'doctor' ? 'Switch to Clinic' : 'Switch to Doctor'}
            >
              {authState.activeMode === 'doctor' ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Stethoscope className="w-5 h-5 text-green-600" />
              )}
            </button>
          )}
          
          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide-out Menu */}
          <div className="fixed top-[57px] left-0 right-0 bottom-0 bg-white z-40 overflow-auto">
            <div className="p-4 space-y-1">
              {filteredMenuItems.map((item, index) => (
                <button
                  key={item.path || `action-${index}`}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    item.path && location.pathname === item.path
                      ? "bg-primary text-white"
                      : "hover:bg-muted hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  {item.showBadge && unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex items-center justify-around px-2 py-1">
          {filteredMenuItems.slice(0, 5).map((item) => (
            <button
              key={item.path}
              onClick={() => item.path && handleNavigation(item.path)}
              className={`flex flex-col items-center p-2 rounded-lg relative ${
                item.path && location.pathname === item.path
                  ? "text-primary"
                  : "text-gray-600"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.title}</span>
              {item.showBadge && unreadCount > 0 && (
                <Badge className="absolute -top-1 right-2 min-w-4 h-4 p-0 text-xs bg-red-500 text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <div
      className={`bg-white border-r h-full flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
      style={{ scrollbarWidth: "none" }}
    >
      {/* HEADER */}
      <div className="p-4 border-b flex items-center">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-primary">
                  Doctor Portal
                </h2>
                <p className="text-xs text-muted-foreground">
                  {authState.activeMode === 'doctor' ? 'Doctor Mode' : 'Clinic Mode'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 h-auto ml-auto"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 h-auto"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* HYBRID TOGGLE BUTTON */}
      {authState.isHybrid && (
        <>
          {!sidebarCollapsed ? (
            <div className="px-2 py-3 border-b">
              <button
                onClick={handleToggleMode}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  ${authState.activeMode === 'doctor' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                    : 'bg-green-50 text-green-600 border border-green-200 shadow-sm'
                  }
                  hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                `}
              >
                {authState.activeMode === 'doctor' ? (
                  <Stethoscope className="w-5 h-5" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
                
                <span className="text-sm font-medium flex-1 text-left">
                  {authState.activeMode === 'doctor' ? '👨‍⚕️ Switch to Clinic' : '🏥 Switch to Doctor'}
                </span>
                
                <ArrowRightLeft className="w-4 h-4 opacity-70" />
              </button>
            </div>
          ) : (
            <div className="px-2 py-2 flex justify-center border-b">
              <button
                onClick={handleToggleMode}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                title={authState.activeMode === 'doctor' ? 'Switch to Clinic Mode' : 'Switch to Doctor Mode'}
              >
                {authState.activeMode === 'doctor' ? (
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                ) : (
                  <Building2 className="w-5 h-5 text-green-600" />
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* NAVIGATION */}
      <nav
        className="flex-1 p-2 space-y-1"
        style={{ overflow: "scroll", scrollbarWidth: "none" }}
      >
        {filteredMenuItems.map((item, index) => (
          <button
            key={item.path || `action-${index}`}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-3"
                : "justify-start px-3 gap-3"
            } py-2.5 rounded-lg transition-all duration-200 ${
              item.path && location.pathname === item.path
                ? "bg-primary text-white"
                : "hover:bg-muted hover:text-primary"
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.showBadge && unreadCount > 0 && sidebarCollapsed && (
                <Badge
                  className="absolute -top-1 -right-1 min-w-4 h-4 p-0 text-xs flex items-center justify-center bg-red-500 text-white"
                  variant="destructive"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </div>

            {!sidebarCollapsed && (
              <>
                <span className="text-sm">{item.title}</span>
                {item.showBadge && unreadCount > 0 && (
                  <Badge className="ml-auto bg-white text-primary">
                    {unreadCount}
                  </Badge>
                )}
              </>
            )}
          </button>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            sidebarCollapsed
              ? "justify-center px-3"
              : "justify-start px-3 gap-3"
          } py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </nav>

      {/* USER SECTION */}
      {!sidebarCollapsed && authState.token && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              {authState.doctorId
                ? authState.doctorId.charAt(0).toUpperCase()
                : "D"}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                {authState.activeMode === 'doctor' ? 'Welcome Doctor' : 'Welcome'}
              </p>
              <p className="text-sm truncate">
                {authState.doctorId || "Doctor ID"}
              </p>
              {authState.activeMode === 'clinic' && authState.clinicId && (
                <p className="text-xs text-muted-foreground truncate">
                  Clinic: {authState.clinicId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <SidebarProvider>
      <DentalChartGlobalPreloader />
      <ToastProvider />
      <div className="flex min-h-screen w-full">
        {/* Only show Sidebar if not on login page */}
        {!isLoginPage && !isMobile && <DesktopSidebar />}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isLoginPage ? 'w-full' : ''}`}>
          {/* Mobile Navigation */}
          {!isLoginPage && isMobile && <MobileNavigation />}
          
          <div className={`flex-1 flex flex-col ${!isLoginPage && isMobile ? 'pt-[57px] pb-[70px]' : ''}`}>
            <SidebarInset className="flex flex-col flex-1">
              {/* Only show DashboardHeader if not on login page, authenticated, and not mobile */}
              {!isLoginPage && !isMobile && authState.token && isValidDoctorId(authState.doctorId) && (
                <DashboardHeader
                  doctorName="Emily Parker"
                  doctorId={authState.doctorId}
                  userRole={authState.role || "doctor"}
                  notificationServiceUrl={NOTIFICATION_SERVICE_URL}
                  onNotificationsUpdate={handleNotificationsUpdate}
                />
              )}

              <main className="flex-1 p-4 md:p-6 overflow-auto">
                <Routes>
                  <Route 
                    path="/login" 
                    element={
                      authState.token ? <Navigate to="/dashboard" replace /> : <DoctorLogin />
                    } 
                  />
                  
                  <Route
                    path="/dashboard"
                    element={
                      authState.token ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <AppointmentsList />
                          <AlertsPanel
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkAsRead={handleMarkAsRead}
                            onDismiss={handleDismiss}
                          />
                        </div>
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />

                  <Route
                    path="/appointments"
                    element={
                      authState.token ? <AppointmentsList /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/patients"
                    element={
                      authState.token ? (
                        <PatientRecords doctorId={authState.doctorId} />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                  
                  <Route
                    path="/prescriptions"
                    element={
                      authState.token ? <EPrescription /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/analytics"
                    element={
                      authState.token ? <ProductivityCharts /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/alerts"
                    element={
                      authState.token ? (
                        <AlertsPanel
                          notifications={notifications}
                          unreadCount={unreadCount}
                          onMarkAsRead={handleMarkAsRead}
                          onDismiss={handleDismiss}
                        />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                  
                  <Route
                    path="/blog"
                    element={
                      authState.token ? <BlogList /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/myblogs"
                    element={
                      authState.token ? <MyBlogList /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/blogs/create"
                    element={
                      authState.token ? <CreateBlog /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/blogs/edit/:id"
                    element={
                      authState.token ? <CreateBlog /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/blogs/:id"
                    element={
                      authState.token ? <BlogDetail /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/marketplace"
                    element={
                      authState.token ? <Marketplace /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route
                    path="/dashboard/cbct-viewer"
                    element={
                      authState.token ? <CBCTViewerPage /> : <Navigate to="/login" replace />
                    }
                  />
                  
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </main>
            </SidebarInset>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}