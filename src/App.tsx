import { useState } from "react";
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
  SidebarTrigger,
} from "./components/ui/sidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { AppointmentsList } from "./components/AppointmentsList";
import { PatientRecords } from "./components/PatientRecords";
import { EPrescription } from "./components/EPrescription";
import { ProductivityCharts } from "./components/ProductivityCharts";
import { Marketplace } from "./components/Marketplace";
import { AlertsPanel } from "./components/AlertsPanel";

const menuItems = [
  {
    id: "overview",
    title: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: Calendar,
  },
  {
    id: "patients",
    title: "Patient Records",
    icon: FileText,
  },
  {
    id: "prescriptions",
    title: "E-Prescription",
    icon: ClipboardList,
  },
  {
    id: "alerts",
    title: "Alerts",
    icon: Bell,
  },
  {
    id: "analytics",
    title: "Productivity",
    icon: TrendingUp,
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: ShoppingBag,
  },
];

export default function App() {
  const [activeView, setActiveView] = useState("overview");

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
                {menuItems.find((item) => item.id === activeView)?.title || "Overview"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeView === "overview" && "Welcome back! Here's your daily overview."}
                {activeView === "appointments" && "Manage your daily appointments and patient visits."}
                {activeView === "patients" && "Access patient records, medical history, and treatment notes."}
                {activeView === "prescriptions" && "Create and manage e-prescriptions and treatment plans."}
                {activeView === "alerts" && "Stay updated with follow-ups, pending tasks, and new reports."}
                {activeView === "analytics" && "Track your performance and productivity metrics."}
                {activeView === "marketplace" && "Browse and order dentistry products and supplies."}
              </p>
            </div>
            
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
