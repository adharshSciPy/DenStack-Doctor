import { useEffect, useState, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();
  const location = useLocation();



  useEffect(() => {
    setSidebarCollapsed(true);
  }, [location.pathname]);



  useEffect(() => {
    const storedDoctorId = getStorageValue(STORAGE_KEYS.DOCTOR_ID);
    const storedClinicId = getStorageValue(STORAGE_KEYS.CLINIC_ID);
    const storedActiveMode = getStorageValue(STORAGE_KEYS.ACTIVE_MODE) as 'doctor' | 'clinic' | null;
    const storedIsHybrid = getStorageValue(STORAGE_KEYS.IS_HYBRID);

    console.log("🔍 Initial storage check:", {
      storedDoctorId,
      storedClinicId,
      storedActiveMode,
      storedIsHybrid
    });

    if (storedDoctorId && !isValidDoctorId(storedDoctorId)) {
      console.warn("🧹 Clearing invalid doctorId:", storedDoctorId);
      removeStorageKey(STORAGE_KEYS.DOCTOR_ID);
    } else if (isValidDoctorId(storedDoctorId)) {
      setAuthState((prev) => ({ 
        ...prev, 
        doctorId: storedDoctorId,
        clinicId: storedClinicId,
        isHybrid: storedIsHybrid === 'true',
        activeMode: storedActiveMode === 'clinic' ? 'clinic' : 'doctor',
      }));
    }
  }, []);

 

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

      clearStorage();

      setStorageValue(STORAGE_KEYS.AUTH_TOKEN, token, persistent);
      setStorageValue(STORAGE_KEYS.USER_ROLE, role, persistent);
      setStorageValue(STORAGE_KEYS.IS_HYBRID, String(isHybrid), persistent);

      if (isValidDoctorId(doctorId)) {
        setStorageValue(STORAGE_KEYS.DOCTOR_ID, doctorId, persistent);
      }

      if (clinicId) {
        setStorageValue(STORAGE_KEYS.CLINIC_ID, clinicId, persistent);
      }

      // Set default active mode to 'doctor' for doctor portal
      setStorageValue(STORAGE_KEYS.ACTIVE_MODE, 'doctor', persistent);

      setAuthState({
        token,
        role,
        doctorId: isValidDoctorId(doctorId) ? doctorId : null,
        clinicId: clinicId || null,
        isHybrid,
        activeMode: 'doctor',
      });

      navigate("/dashboard", { replace: true });
    },
    [navigate],
  );

  /* -------------------- AUTH + ROUTING CORE -------------------- */

  useEffect(() => {
    console.log("🩺 Doctor Portal initialized");

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MAIN_APP_ORIGIN) return;

      console.log("📨 Message received:", event.data);

      const { type, token, role, doctorId, clinicId, isHybrid } = event.data || {};

      if (type !== "LOGIN_DATA" || !token || !role) return;

      handleAuthUpdate(token, role, doctorId, clinicId, false, isHybrid === true);
    };

    window.addEventListener("message", handleMessage);

    /* -------- URL LOGIN SUPPORT -------- */

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const urlDoctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");
    const isHybrid = params.get("isHybrid") === "true" || params.get("role") === "760";

    console.log("🔍 URL params:", { token, role, urlDoctorId, clinicId, isHybrid });

    if (token && role) {
      handleAuthUpdate(
        token,
        role,
        urlDoctorId || undefined,
        clinicId || undefined,
        true,
        isHybrid,
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      /* -------- PERSISTENT LOGIN -------- */

      const storedToken = getStorageValue(STORAGE_KEYS.AUTH_TOKEN);
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
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [handleAuthUpdate]);

  /* -------------------- HANDLE REPEATED URL TOKENS -------------------- */

  useEffect(() => {
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
  }, [location, handleAuthUpdate]);

  /* -------------------- THEME -------------------- */

  const clinicId = getStorageValue(STORAGE_KEYS.CLINIC_ID);
  useClinicTheme(clinicId || "");

  /* -------------------- LOGOUT -------------------- */

  const handleLogout = useCallback(() => {
    clearStorage();
    window.location.href = MAIN_APP_ORIGIN;
  }, []);

/* -------------------- TOGGLE MODE (for hybrid users) -------------------- */

const handleToggleMode = useCallback(() => {
  if (!authState.isHybrid) return;
  
  const newMode = authState.activeMode === 'doctor' ? 'clinic' : 'doctor';
  console.log("🔄 Toggling mode:", { current: authState.activeMode, new: newMode });
  
  // Update local storage
  setStorageValue(STORAGE_KEYS.ACTIVE_MODE, newMode, true);
  
  if (newMode === 'clinic') {
    if (authState.clinicId && authState.doctorId && authState.token) {

      const clinicDashboardUrl = `${MAIN_APP_ORIGIN}/dashboard/${authState.clinicId}`;
      const redirectURL = `${clinicDashboardUrl}?token=${encodeURIComponent(authState.token)}&role=760&doctorId=${authState.doctorId}&clinicId=${authState.clinicId}&isHybrid=true&mode=clinic`;
      
      console.log("➡️ Redirecting directly to clinic dashboard:", redirectURL);
      window.location.href = redirectURL;
    } else {
      console.error("❌ Missing clinicId or doctorId for clinic mode", {
        clinicId: authState.clinicId,
        doctorId: authState.doctorId,
        token: authState.token
      });
    }
  } else {
   
    if (authState.clinicId && authState.doctorId && authState.token) {
      const doctorPortalUrl = `http://localhost:3001/login-redirect`;
      const redirectURL = `${doctorPortalUrl}?token=${encodeURIComponent(authState.token)}&role=760&doctorId=${authState.doctorId}&clinicId=${authState.clinicId}&isHybrid=true&mode=doctor`;
      
      console.log("➡️ Redirecting to doctor portal:", redirectURL);
      window.location.href = redirectURL;
    }
    
    setAuthState(prev => ({ ...prev, activeMode: 'doctor' }));
  }
}, [authState]);

  /* -------------------- MENU -------------------- */

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { path: "/dashboard", title: "Overview", icon: LayoutDashboard, showInClinicMode: false },
      { path: "/appointments", title: "Appointments", icon: Calendar, showInClinicMode: true },
      { path: "/patients", title: "Patient Records", icon: FileText, showInClinicMode: true },
      { path: "/prescriptions", title: "E-Prescription", icon: ClipboardList, showInClinicMode: true },
      {
        path: "/alerts",
        title: "Alerts",
        icon: Bell,
        showBadge: true,
        showInClinicMode: true,
      },
      { path: "/analytics", title: "Productivity", icon: TrendingUp, showInClinicMode: true },
      { path: "/blog", title: "Blog", icon: BookOpen, showInClinicMode: false },
      { path: "/myblogs", title: "My Blogs", icon: BookOpen, showInClinicMode: false },
    ];

    // Add marketplace for role 600
    if (authState.role === "600") {
      items.push({
        path: "/marketplace",
        title: "Marketplace",
        icon: ShoppingBag,
        showInClinicMode: true,
      });
    }

    // Logout is always shown
    items.push({
      title: "Logout",
      icon: LogOut,
      onClick: handleLogout,
      showInClinicMode: true,
    });

    return items;
  }, [authState.role, handleLogout]);
  const filteredMenuItems = useMemo(() => {
    if (authState.activeMode === 'doctor') {
      return menuItems;
    } else {
      return menuItems.filter(item => item.showInClinicMode !== false);
    }
  }, [menuItems, authState.activeMode]);

  /* -------------------- NOTIFICATIONS -------------------- */

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

  /* -------------------- RENDER -------------------- */

  // Debug log to see auth state
  console.log("📊 Current auth state:", {
    role: authState.role,
    isHybrid: authState.isHybrid,
    activeMode: authState.activeMode,
    clinicId: authState.clinicId,
    doctorId: authState.doctorId
  });

  return (
    <SidebarProvider>
      <DentalChartGlobalPreloader />
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
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

          {/* HYBRID TOGGLE BUTTON - Only for hybrid users */}
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
                    navigate(item.path);
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

                {/* Show text only when not collapsed */}
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
          </nav>

          {/* USER SECTION - Only show when expanded */}
          {!sidebarCollapsed && (
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col">
            <SidebarInset className="flex flex-col flex-1">
              {isValidDoctorId(authState.doctorId) && (
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
                    path="/dashboard"
                    element={
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AppointmentsList />
                        <AlertsPanel
                          notifications={notifications}
                          unreadCount={unreadCount}
                          onMarkAsRead={handleMarkAsRead}
                          onDismiss={handleDismiss}
                        />
                      </div>
                    }
                  />

                  <Route path="/appointments" element={<AppointmentsList />} />
                  <Route path="/patients" element={<PatientRecords doctorId={authState.doctorId} />} />
                  <Route path="/prescriptions" element={<EPrescription />} />
                  <Route path="/analytics" element={<ProductivityCharts />} />
                  <Route
                    path="/alerts"
                    element={
                      <AlertsPanel
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAsRead={handleMarkAsRead}
                        onDismiss={handleDismiss}
                      />
                    }
                  />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/myblogs" element={<MyBlogList />} />
                  <Route path="/blogs/create" element={<CreateBlog />} />
                  <Route path="/blogs/edit/:id" element={<CreateBlog />} />
                  <Route path="/blogs/:id" element={<BlogDetail />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route
                    path="/dashboard/cbct-viewer"
                    element={<CBCTViewerPage />}
                  />
                  <Route path="/" element={<AppointmentsList />} />
                  <Route path="*" element={<AppointmentsList />} />
                </Routes>
              </main>
            </SidebarInset>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}