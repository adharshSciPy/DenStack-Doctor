import { useState, useEffect } from "react";
import { useClinicTheme } from "./hooks/useClinicTheme";
import {
  Calendar,
  FileText,
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Bell,
  LayoutDashboard,
  LogIn,
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
import  EPrescription  from "./components/EPrescription";
import { ProductivityCharts } from "./components/ProductivityCharts";
import { Marketplace } from "./components/Marketplace";
import { AlertsPanel } from "./components/AlertsPanel";
import { useLocation, useNavigate } from "react-router-dom";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  appointmentId?: string;
  patientId?: string;
  clinicId?: string;
  metadata?: any;
}

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Helper: Check if a doctorId is valid (not null, undefined, 'undefined', 'null', or empty)
  const isValidDoctorId = (id: any): id is string => {
    return typeof id === 'string' && id.trim() !== '' && id !== 'undefined' && id !== 'null';
  };

  // Clean up any corrupted doctorId from storage on app start
  useEffect(() => {
    const storedDoctorId = sessionStorage.getItem("doctorId") || localStorage.getItem("doctorId");
    
    if (storedDoctorId && !isValidDoctorId(storedDoctorId)) {
      console.warn("🧹 Detected invalid doctorId in storage, clearing:", storedDoctorId);
      sessionStorage.removeItem("doctorId");
      localStorage.removeItem("doctorId");
    } else if (isValidDoctorId(storedDoctorId)) {
      console.log("✅ Valid DoctorId loaded from storage:", storedDoctorId);
      setDoctorId(storedDoctorId);
    }
  }, []);

  // Main authentication & routing logic
  useEffect(() => {
    console.log("🩺 Doctor Portal loaded — setting up message listener...");

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "http://localhost:3000") return;
      const { type, token, role, doctorId: msgDoctorId, clinicId } = event.data || {};
      if (type !== "LOGIN_DATA" || !token || !role) return;

      console.log("✅ LOGIN_DATA received:", {
        token: !!token,
        role,
        doctorId: msgDoctorId,
        clinicId,
      });

      // Clear previous session
      sessionStorage.clear();
      localStorage.clear();

      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("userRole", role);

      if (isValidDoctorId(msgDoctorId)) {
        sessionStorage.setItem("doctorId", msgDoctorId);
        setDoctorId(msgDoctorId);
        console.log("✅ Valid DoctorId set from message:", msgDoctorId);
      } else if (msgDoctorId) {
        console.warn("⚠️ Invalid doctorId from message, ignoring:", msgDoctorId);
      }

      if (clinicId) sessionStorage.setItem("clinicId", clinicId);

      setAuthToken(token);
      setUserRole(role);

      // Navigate safely
      if (role === "600" && isValidDoctorId(msgDoctorId)) {
        navigate(`/doctor/${msgDoctorId}/dashboard`, { replace: true });
      } else if (role === "456" && clinicId) {
        navigate(`/clinic/${clinicId}/dashboard`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener("message", handleMessage);

    // Handle login via URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const urlDoctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");

    if (token && role) {
      console.log("🎯 Login data from URL:", {
        token: !!token,
        role,
        doctorId: urlDoctorId,
        clinicId,
      });

      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);

      if (isValidDoctorId(urlDoctorId)) {
        localStorage.setItem("doctorId", urlDoctorId);
        setDoctorId(urlDoctorId);
        console.log("✅ Valid DoctorId set from URL:", urlDoctorId);
      } else if (urlDoctorId) {
        console.warn("⚠️ Invalid doctorId from URL, ignoring:", urlDoctorId);
      }

      if (clinicId) localStorage.setItem("clinicId", clinicId);

      setAuthToken(token);
      setUserRole(role);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Navigate correctly
      if (role === "600" && isValidDoctorId(urlDoctorId)) {
        navigate(`/doctor/${urlDoctorId}/dashboard`, { replace: true });
      } else if (role === "456" && clinicId) {
        navigate(`/clinic/${clinicId}/dashboard`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Load from storage (persistent login)
      const storedToken = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
      const storedRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
      const storedDoctorId = sessionStorage.getItem("doctorId") || localStorage.getItem("doctorId");

      if (storedToken && storedRole) {
        console.log("💾 Loaded from storage:", {
          storedToken: !!storedToken,
          storedRole,
          doctorId: storedDoctorId
        });

        setAuthToken(storedToken);
        setUserRole(storedRole);

        if (isValidDoctorId(storedDoctorId)) {
          setDoctorId(storedDoctorId);
          console.log("✅ Valid DoctorId restored:", storedDoctorId);
        } else if (storedDoctorId) {
          console.warn("⚠️ Invalid stored doctorId, clearing:", storedDoctorId);
          sessionStorage.removeItem("doctorId");
          localStorage.removeItem("doctorId");
        }
      } else {
        console.log("ℹ️ No stored credentials found (fresh load).");
      }
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  // Handle repeated token/role in URL (e.g. social login redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const role = params.get("role");
    const urlDoctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");

    if (token && role) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);
      
      if (isValidDoctorId(urlDoctorId)) {
        localStorage.setItem("doctorId", urlDoctorId);
        setDoctorId(urlDoctorId);
      }
      
      if (clinicId) {
        localStorage.setItem("clinicId", clinicId);
      }
      
      setAuthToken(token);
      setUserRole(role);
      
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  // Apply clinic theme
  const clinicId = localStorage.getItem("clinicId") || sessionStorage.getItem("clinicId");
  useClinicTheme(clinicId || "");
  console.log("🏥 Clinic ID:", clinicId);

  // Notification handlers
  const handleNotificationsUpdate = (newNotifications: Notification[], newUnreadCount: number) => {
    setNotifications(newNotifications);
    setUnreadCount(newUnreadCount);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!isValidDoctorId(doctorId)) {
      console.error("❌ Cannot mark as read: Invalid or missing doctorId");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8011/api/notifications/in-app/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: doctorId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updated = notifications.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updated);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    handleMarkAsRead(notificationId);
  };

  // Menu items based on role
  const getMenuItems = () => {
    const baseMenuItems = [
      { id: "overview", title: "Overview", icon: LayoutDashboard },
      { id: "appointments", title: "Appointments", icon: Calendar },
      { id: "patients", title: "Patient Records", icon: FileText },
      { id: "prescriptions", title: "E-Prescription", icon: ClipboardList },
      { id: "alerts", title: "Alerts", icon: Bell },
      { id: "analytics", title: "Productivity", icon: TrendingUp },
    ];

    if (userRole === "600") {
      return [
        ...baseMenuItems,
        { id: "marketplace", title: "Marketplace", icon: ShoppingBag },
      ];
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="grid grid-cols-2 gap-6">
            <AppointmentsList />
            <AlertsPanel 
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
            />
          </div>
        );
      case "appointments":
        return <AppointmentsList />;
      case "patients":
        return <PatientRecords />;
      case "prescriptions":
        return <EPrescription />;
      case "alerts":
        return (
          <AlertsPanel 
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onDismiss={handleDismiss}
          />
        );
      case "analytics":
        return <ProductivityCharts />;
      case "marketplace":
        return <Marketplace />;
      default:
        return (
          <div className="grid grid-cols-2 gap-6">
            <AppointmentsList />
            <AlertsPanel 
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
            />
          </div>
        );
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("🧭 Active View:", activeView);
    console.log("👤 Current Role:", userRole);
    console.log("🔑 Auth Token:", authToken ? "Available ✅" : "Missing ❌");
    console.log("👨‍⚕️ Doctor ID:", doctorId || "Not set");
  }, [activeView, userRole, authToken, doctorId]);

  console.log('🎨 Rendering App with doctorId:', {
    doctorId,
    type: typeof doctorId,
    isValid: isValidDoctorId(doctorId),
    length: doctorId?.length
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Updated Sidebar with matching color theme */}
        <Sidebar className="border-r border-border bg-white">
          <SidebarContent>
            {/* Header - matching DashboardSidebar style */}
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-medium text-foreground">
                Doctor Portal
              </h2>
              <p className="text-sm text-muted-foreground">
                Hospital Management System
              </p>
            </div>

            {/* Main Menu Group */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                        tooltip={item.title}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-md 
                          transition-all duration-200
                          ${
                            activeView === item.id
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-900"
                          }
                        `}
                        style={
                          activeView === item.id
                            ? {
                                background:
                                  "linear-gradient(135deg, var(--primary) 0%, var(--primary-end) 100%)",
                              }
                            : {}
                        }
                        onMouseEnter={(e) => {
                          if (activeView !== item.id) {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg, var(--primary) 0%, var(--primary-end) 100%)";
                            e.currentTarget.style.color = "white";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeView !== item.id) {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "";
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                        {item.id === "alerts" && unreadCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs">
                            {unreadCount > 99 ? "99+" : unreadCount}
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

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col">
          {isValidDoctorId(doctorId) ? (
            <>
              {console.log('✅ Rendering DashboardHeader with valid doctorId:', doctorId)}
              <DashboardHeader 
                doctorName="Emily Parker"
                doctorId={doctorId}
                userRole={userRole || "doctor"}
                notificationServiceUrl="http://localhost:8011"
                onNotificationsUpdate={handleNotificationsUpdate}
              />
            </>
          ) : (
            <header className="border-b bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {authToken ? "Loading doctor profile..." : "Please log in to continue."}
                  </p>
                </div>
              </div>
            </header>
          )}

          <main className="flex-1 p-6 bg-[linear-gradient(to_left,var(--primary),var(--primary-end))]">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {menuItems.find((item) => item.id === activeView)?.title ||
                  "Overview"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeView === "overview" &&
                  "Welcome back! Here's your daily overview."}
                {activeView === "appointments" &&
                  "Manage your daily appointments and patient visits."}
                {activeView === "patients" &&
                  "Access patient records, medical history, and treatment notes."}
                {activeView === "prescriptions" &&
                  "Create and manage e-prescriptions and treatment plans."}
                {activeView === "alerts" &&
                  "Stay updated with follow-ups, pending tasks, and new reports."}
                {activeView === "analytics" &&
                  "Track your performance and productivity metrics."}
                {activeView === "marketplace" &&
                  "Browse and order dentistry products and supplies."}
              </p>
            </div>

            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}