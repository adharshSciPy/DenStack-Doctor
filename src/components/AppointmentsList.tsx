import {
  Clock,
  MapPin,
  Phone,
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  MoveRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";


interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  age: number;
  gender: string;
  patientUniqueId: string;
}

interface AppointmentResponse {
  _id: string;
  patientId: Patient;
  clinicId: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdBy: string;
  opNumber: number;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientUniqueId: string;
  time: string;
  date: string;
  type: "in-person" | "video";
  status: "scheduled" | "completed" | "cancelled" | "in-progress";
  department: string;
  contact: string;
  email: string;
  opNumber: number;
  age: number;
  gender: string;
}

interface CursorPaginationData {
  currentPage: number;
  itemsPerPage: number;
  hasMore: boolean;
  cursors: (string | null)[];
  totalFetched: number;
}

export function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<CursorPaginationData>({
    currentPage: 1,
    itemsPerPage: 10,
    hasMore: false,
    cursors: [null],
    totalFetched: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());


  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const transformAppointment = (apt: AppointmentResponse): Appointment => {
    return {
      id: apt._id,
      patientName: apt.patientId.name,
      patientUniqueId: apt.patientId.patientUniqueId,
      time: formatTime(apt.appointmentTime),
      date: formatDate(apt.appointmentDate),
      type: "in-person",
      status: apt.status as any,
      department: apt.department,
      contact: apt.patientId.phone.toString(),
      email: apt.patientId.email || "",
      opNumber: apt.opNumber,
      age: apt.patientId.age,
      gender: apt.patientId.gender,
    };
  };

 const fetchAppointments = async (
  page: number = 1,
  search: string = "",
  resetSearch: boolean = false,
  date: Date | null = selectedDate
) => {
  try {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const cursor =
      resetSearch ? null : page > 1 ? pagination.cursors[page - 1] : null;

    // ✅ Format date as YYYY/MM/DD
    const formattedDate = date
      ? `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}/${String(date.getDate()).padStart(2, "0")}`
      : "";

    const queryParams = new URLSearchParams({
      limit: pagination.itemsPerPage.toString(),
      ...(search && { search }),
      ...(cursor && { cursor }),
      ...(formattedDate && { date: formattedDate }),
    });

    const response = await fetch(
      `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok)
      throw new Error(`Failed to fetch: ${response.statusText}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Fetch failed");

    const transformed = result.data.map(transformAppointment);
    setAppointments(transformed);

    const newCursors = [...pagination.cursors];
    if (resetSearch) newCursors.length = 1;

    if (result.nextCursor && page === newCursors.length) {
      newCursors.push(result.nextCursor);
    }

    setPagination((prev) => ({
      ...prev,
      currentPage: page,
      hasMore: result.hasMore || false,
      cursors: newCursors,
      totalFetched: resetSearch
        ? result.count
        : prev.totalFetched + result.count,
    }));
  } catch (err) {
    console.error("Fetch error:", err);
    setError(err instanceof Error ? err.message : "Fetch failed");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAppointments(1);
  }, []);

  useEffect(() => {
    // Trigger search only after 3+ characters
    const timeoutId = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          cursors: [null],
          totalFetched: 0,
        }));
        fetchAppointments(1, searchQuery, true);
      }
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage =
      direction === "next"
        ? pagination.currentPage + 1
        : pagination.currentPage - 1;
    if (direction === "prev" && newPage >= 1) {
      fetchAppointments(newPage, searchQuery);
    } else if (direction === "next" && pagination.hasMore) {
      fetchAppointments(newPage, searchQuery);
    }
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  return (
    <Card>
     <CardHeader>
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <CardTitle>Appointments</CardTitle>
      <p className="text-sm text-muted-foreground">
        {selectedDate
          ? format(selectedDate, "EEEE, MMMM d, yyyy")
          : "Select a date"}
      </p>
    </div>

    {/* Calendar Date Picker */}
     <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[160px] justify-start"
        >
          <CalendarIcon className="h-4 w-4" />
          {selectedDate
            ? format(selectedDate, "MMM d, yyyy")
            : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date: Date | undefined) => {
            const normalizedDate = date ?? null;
            setSelectedDate(normalizedDate);
            fetchAppointments(1, searchQuery, true, normalizedDate);
          }}
          initialFocus
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  </div>

  {/* Search bar with icon on right */}
  <div className="relative mt-4">
    <Search
      className="absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
      style={{ right: "10px" }}
    />
    <Input
      placeholder="Search by name, phone, or patient ID..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pr-9"
    />
  </div>
</CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button
                onClick={() =>
                  fetchAppointments(pagination.currentPage, searchQuery)
                }
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Show message even when no appointments */}
            {appointments.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground text-lg">
                    No appointments found
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {appointment.patientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">
                                {appointment.patientName}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                ({appointment.patientUniqueId})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {appointment.age}Y, {appointment.gender}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  OP#{appointment.opNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {appointment.type === "in-person" ? (
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <Video className="h-4 w-4 flex-shrink-0" />
                                )}
                                <span>
                                  {appointment.type === "in-person"
                                    ? "In-Person"
                                    : "Video Call"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{appointment.contact}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <Badge variant="outline" className="font-normal">
                                {appointment.department}
                              </Badge>
                              <span className="text-muted-foreground">
                                {appointment.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Always visible pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>
                  Page {pagination.currentPage} • Showing {appointments.length}{" "}
                  appointment
                  {appointments.length !== 1 ? "s" : ""}
                </p>
                {searchQuery && (
                  <p className="text-xs mt-1">Filtered by: "{searchQuery}"</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("prev")}
                  disabled={pagination.currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="px-3 py-1 text-sm border rounded-md bg-muted">
                  {pagination.currentPage}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={!pagination.hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
