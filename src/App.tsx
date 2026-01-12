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

  const navigate = useNavigate();
  const location = useLocation();

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
      { path: "/prescriptions", title: "E-Prescription", icon: ClipboardList },
      {
        path: "/alerts",
        title: "Alerts",
        icon: Bell,
        showBadge: true,
      },
      { path: "/analytics", title: "Productivity", icon: TrendingUp },
      { path: "/blog", title: "Blog", icon: BookOpen },
      // { path: "/myblogs", title: "My Blogs", icon: BookOpen },
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
        <Sidebar className="border-r bg-white">
          <SidebarContent>
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-medium">Doctor Portal</h2>
              <p className="text-sm text-muted-foreground">
                Hospital Management System
              </p>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item, index) => (
                    <SidebarMenuItem key={item.path || `action-${index}`}>
                      <SidebarMenuButton
                        isActive={item.path ? location.pathname === item.path : false}
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick();
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>

                        {item.showBadge && unreadCount > 0 && (
                          <Badge className="ml-auto" variant="destructive">
                            {unreadCount}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

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
              <Route path="/patients" element={<PatientRecords />} />
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
    </SidebarProvider>
  );
}