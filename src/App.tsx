import { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Bell,
  LayoutDashboard,
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

  // ✅ Step 1: Handle /login-redirect from URL (same-tab redirect)
useEffect(() => {
  console.log("🩺 Doctor Portal loaded — setting up message listener...");

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== "http://localhost:3000") return;
    const { type, token, role, doctorId, clinicId } = event.data || {};
    if (type !== "LOGIN_DATA" || !token || !role) return;

    console.log("✅ LOGIN_DATA received:", { token, role, doctorId, clinicId });

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

  // ✅ Handle URL-based login redirect (same-tab)
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const role = params.get("role");
  const doctorId = params.get("doctorId");
  const clinicId = params.get("clinicId");

  if (token && role) {
    console.log("🎯 Login data from URL:", { token, role, doctorId, clinicId });

    // 1️⃣ Save credentials securely
    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", role);
    if (doctorId) localStorage.setItem("doctorId", doctorId);
    if (clinicId) localStorage.setItem("clinicId", clinicId);

    setAuthToken(token);
    setUserRole(role);

    // 2️⃣ Clean up the URL (remove query params)
    window.history.replaceState({}, document.title, window.location.pathname);

    // 3️⃣ Navigate based on role
    if (role === "600") navigate(`/doctor/${doctorId}/dashboard`, { replace: true });
    else if (role === "456") navigate(`/clinic/${clinicId}/dashboard`, { replace: true });
    else navigate("/dashboard", { replace: true });
  } else {
    // ✅ Fallback: restore from session/local storage
    const storedToken =
      sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
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


  // ✅ Step 3: Role-based menu setup
  const getMenuItems = () => {
    const baseMenuItems = [
      { id: "overview", title: "Overview", icon: LayoutDashboard },
      { id: "appointments", title: "Appointments", icon: Calendar },
      { id: "patients", title: "Patient Records", icon: FileText },
      { id: "prescriptions", title: "E-Prescription", icon: ClipboardList },
      { id: "alerts", title: "Alerts", icon: Bell },
      { id: "analytics", title: "Productivity", icon: TrendingUp },
    ];

    // Add Marketplace only for Doctor (600)
    if (userRole === "600") {
      return [
        ...baseMenuItems,
        { id: "marketplace", title: "Marketplace", icon: ShoppingBag },
      ];
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  // ✅ Step 4: View renderer
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

  // ✅ Step 5: Debug log for every re-render
  useEffect(() => {
    console.log("🧭 Active View:", activeView);
    console.log("👤 Current Role:", userRole);
    console.log("🔑 Auth Token:", authToken ? "Available ✅" : "Missing ❌");
  }, [activeView, userRole, authToken]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-medium text-sidebar-foreground">
                Doctor Portal
              </h2>
              <p className="text-sm text-sidebar-foreground/70">
                Hospital Management System
              </p>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <DashboardHeader doctorName="Emily Parker" alertCount={5} />

          <main className="flex-1 p-6 bg-background">
            <div className="mb-6">
              <h1>
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
