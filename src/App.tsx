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
import { DashboardHeader } from "./components/DashboardHeader";
import { AppointmentsList } from "./components/AppointmentsList";
import { PatientRecords } from "./components/PatientRecords";
import { EPrescription } from "./components/EPrescription";
import { ProductivityCharts } from "./components/ProductivityCharts";
import { Marketplace } from "./components/Marketplace";
import { AlertsPanel } from "./components/AlertsPanel";
import { useLocation, useNavigate } from "react-router-dom";

export default function App() {
  const [activeView, setActiveView] = useState("overview");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🩺 Doctor Portal loaded — setting up message listener...");

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "http://localhost:3000") return;
      const { type, token, role, doctorId, clinicId } = event.data || {};
      if (type !== "LOGIN_DATA" || !token || !role) return;

      console.log("✅ LOGIN_DATA received:", {
        token,
        role,
        doctorId,
        clinicId,
      });

      sessionStorage.clear();
      localStorage.clear();

      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("userRole", role);
      if (doctorId) sessionStorage.setItem("doctorId", doctorId);
      if (clinicId) sessionStorage.setItem("clinicId", clinicId);

      setAuthToken(token);
      setUserRole(role);

      if (role === "600") navigate(`/doctor/${doctorId}/dashboard`);
      else if (role === "456") navigate(`/clinic/${clinicId}/dashboard`);
      else navigate("/dashboard");
    };

    window.addEventListener("message", handleMessage);

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const doctorId = params.get("doctorId");
    const clinicId = params.get("clinicId");

    if (token && role) {
      console.log("🎯 Login data from URL:", {
        token,
        role,
        doctorId,
        clinicId,
      });

      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);
      if (doctorId) localStorage.setItem("doctorId", doctorId);
      if (clinicId) localStorage.setItem("clinicId", clinicId);

      setAuthToken(token);
      setUserRole(role);

      window.history.replaceState({}, document.title, window.location.pathname);

      if (role === "600")
        navigate(`/doctor/${doctorId}/dashboard`, { replace: true });
      else if (role === "456")
        navigate(`/clinic/${clinicId}/dashboard`, { replace: true });
      else navigate("/dashboard", { replace: true });
    } else {
      const storedToken =
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken");
      const storedRole =
        sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
      if (storedToken && storedRole) {
        console.log("💾 Loaded from storage:", { storedToken, storedRole });
        setAuthToken(storedToken);
        setUserRole(storedRole);
      } else {
        console.log("ℹ️ No stored credentials found (fresh load).");
      }
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const role = params.get("role");
    if (token && role) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);
      navigate("/dashboard", { replace: true });
    }
  }, [location]);

  const clinicId =
    localStorage.getItem("clinicId") || sessionStorage.getItem("clinicId");
  useClinicTheme(clinicId || "");
  console.log("clinc", clinicId);

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
            <AlertsPanel />
          </div>
        );
      case "appointments":
        return <AppointmentsList />;
      case "patients":
        return <PatientRecords />;
      case "prescriptions":
        return <EPrescription />;
      case "alerts":
        return <AlertsPanel />;
      case "analytics":
        return <ProductivityCharts />;
      case "marketplace":
        return <Marketplace />;
      default:
        return (
          <div className="grid grid-cols-2 gap-6">
            <AppointmentsList />
            <AlertsPanel />
          </div>
        );
    }
  };

  useEffect(() => {
    console.log("🧭 Active View:", activeView);
    console.log("👤 Current Role:", userRole);
    console.log("🔑 Auth Token:", authToken ? "Available ✅" : "Missing ❌");
  }, [activeView, userRole, authToken]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full ">
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
                           duration-200
                          ${
                            activeView === item.id
                              ? "bg-primary text-white"
                              : "hover:bg-accent hover:text-accent-foreground text-foreground"
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
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
          <DashboardHeader doctorName="Emily Parker" alertCount={5} />

          <main className="flex-1 p-6 bg-background">
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