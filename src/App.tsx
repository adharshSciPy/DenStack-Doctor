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
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

/* -------------------------------- CONSTANTS -------------------------------- */

const MAIN_APP_ORIGIN = "http://localhost:3000";
const NOTIFICATION_SERVICE_URL = "http://localhost:8011";
const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ROLE: "userRole",
  DOCTOR_ID: "doctorId",
  CLINIC_ID: "clinicId",
} as const;

/* -------------------------------- TYPES -------------------------------- */

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
}

interface AuthState {
  token: string | null;
  role: string | null;
  doctorId: string | null;
}

/* -------------------------------- HELPERS -------------------------------- */

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

/* -------------------------------- APP -------------------------------- */

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    doctorId: null,
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default to collapsed

  const navigate = useNavigate();
  const location = useLocation();

  /* -------------------- AUTO COLLAPSE ON NAVIGATION -------------------- */
  
  useEffect(() => {
    // Collapse sidebar whenever location changes (navigation)
    setSidebarCollapsed(true);
  }, [location.pathname]);

  /* -------------------- CLEAN CORRUPTED DOCTOR ID -------------------- */

  useEffect(() => {
    const storedDoctorId = getStorageValue(STORAGE_KEYS.DOCTOR_ID);

    if (storedDoctorId && !isValidDoctorId(storedDoctorId)) {
      console.warn("🧹 Clearing invalid doctorId:", storedDoctorId);
      removeStorageKey(STORAGE_KEYS.DOCTOR_ID);
    } else if (isValidDoctorId(storedDoctorId)) {
      setAuthState((prev) => ({ ...prev, doctorId: storedDoctorId }));
    }
  }, []);

  /* -------------------- AUTH HANDLER -------------------- */

  const handleAuthUpdate = useCallback(
    (
      token: string,
      role: string,
      doctorId?: string,
      clinicId?: string,
      persistent = false
    ) => {
      clearStorage();

      setStorageValue(STORAGE_KEYS.AUTH_TOKEN, token, persistent);
      setStorageValue(STORAGE_KEYS.USER_ROLE, role, persistent);

      if (isValidDoctorId(doctorId)) {
        setStorageValue(STORAGE_KEYS.DOCTOR_ID, doctorId, persistent);
      }

      if (clinicId) {
        setStorageValue(STORAGE_KEYS.CLINIC_ID, clinicId, persistent);
      }

      setAuthState({
        token,
        role,
        doctorId: isValidDoctorId(doctorId) ? doctorId : null,
      });

      navigate("/dashboard", { replace: true });
    },
    [navigate]
  );

  /* -------------------- AUTH + ROUTING CORE -------------------- */

  useEffect(() => {
    console.log("🩺 Doctor Portal initialized");

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MAIN_APP_ORIGIN) return;

      const { type, token, role, doctorId, clinicId } = event.data || {};

      if (type !== "LOGIN_DATA" || !token || !role) return;

      handleAuthUpdate(token, role, doctorId, clinicId, false);
    };

    window.addEventListener("message", handleMessage);

    /* -------- URL LOGIN SUPPORT -------- */

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const urlDoctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");

    if (token && role) {
      handleAuthUpdate(token, role, urlDoctorId || undefined, clinicId || undefined, true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      /* -------- PERSISTENT LOGIN -------- */

      const storedToken = getStorageValue(STORAGE_KEYS.AUTH_TOKEN);
      const storedRole = getStorageValue(STORAGE_KEYS.USER_ROLE);
      const storedDoctorId = getStorageValue(STORAGE_KEYS.DOCTOR_ID);

      if (storedToken && storedRole) {
        setAuthState({
          token: storedToken,
          role: storedRole,
          doctorId: isValidDoctorId(storedDoctorId) ? storedDoctorId : null,
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

    if (token && role) {
      handleAuthUpdate(token, role, urlDoctorId || undefined, clinicId || undefined, true);
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

  /* -------------------- MENU -------------------- */

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { path: "/dashboard", title: "Overview", icon: LayoutDashboard },
      { path: "/appointments", title: "Appointments", icon: Calendar },
      { path: "/patients", title: "Patient Records", icon: FileText },
      // { path: "/prescriptions", title: "E-Prescription", icon: ClipboardList },
      {
        path: "/alerts",
        title: "Alerts",
        icon: Bell,
        showBadge: true,
      },
      { path: "/analytics", title: "Productivity", icon: TrendingUp },
      { path: "/blog", title: "Blog", icon: BookOpen },
      { path: "/myblogs", title: "My Blogs", icon: BookOpen },
    ];

    if (authState.role === "600") {
      items.push({
        path: "/marketplace",
        title: "Marketplace",
        icon: ShoppingBag,
      });
    }

    items.push({
      title: "Logout",
      icon: LogOut,
      onClick: handleLogout,
    });

    return items;
  }, [authState.role, handleLogout]);

  /* -------------------- NOTIFICATIONS -------------------- */

  const handleNotificationsUpdate = useCallback(
    (data: Notification[], count: number) => {
      setNotifications(data);
      setUnreadCount(count);
    },
    []
  );

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  /* -------------------- RENDER -------------------- */

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar - Always visible but collapsed/expanded */}
        <div
          className={`bg-white border-r h-full flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {/* HEADER - Simplified when collapsed */}
<div className="p-4 border-b flex items-center">
  {!sidebarCollapsed ? (
    // Expanded state - show logo and title on left, chevron on right
    <>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-primary">Doctor Portal</h2>
          <p className="text-xs text-muted-foreground">Hospital Management</p>
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
    // Collapsed state - centered chevron only
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

          {/* NAVIGATION */}
          <nav className="flex-1 p-2 space-y-1" style={{ overflow: "scroll", scrollbarWidth: "none" }}>
            {menuItems.map((item, index) => (
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
                  sidebarCollapsed ? "justify-center px-3" : "justify-start px-3 gap-3"
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
                  {authState.doctorId ? authState.doctorId.charAt(0).toUpperCase() : "D"}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Welcome Doctor</p>
                  <p className="text-sm truncate">
                    {authState.doctorId || "Doctor ID"}
                  </p>
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
                  <Route path="/patients"   element={<PatientRecords doctorId={authState.doctorId} />} />
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