import { Search, FileText, Calendar, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

const mockRecords: MedicalRecord[] = [
  {
    id: "1",
    date: "2024-10-15",
    type: "Consultation",
    diagnosis: "Gingivitis",
    treatment: "Deep cleaning, prescribed antibacterial mouthwash",
    notes: "Patient shows improvement from last visit"
  },
  {
    id: "2",
    date: "2024-09-20",
    type: "Follow-up",
    diagnosis: "Cavity on tooth #18",
    treatment: "Dental filling completed",
    notes: "Patient tolerated procedure well"
  },
  {
    id: "3",
    date: "2024-08-10",
    type: "Regular Checkup",
    diagnosis: "Healthy",
    treatment: "Routine cleaning",
    notes: "Maintain current oral hygiene routine"
  },
];

export function PatientRecords() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Records</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient name, ID, or diagnosis..."
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Treatment Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {mockRecords.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 hover:bg-[var(--hover)] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">{record.type}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Diagnosis: </span>
                        <Badge variant="outline">{record.diagnosis}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Treatment: </span>
                        <span className="text-sm text-muted-foreground">{record.treatment}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Notes: </span>
                        <span className="text-sm text-muted-foreground">{record.notes}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">View Full Record</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="timeline">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                <div className="relative pl-6 pb-8 border-l-2 border-primary/20">
                  <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Root Canal Treatment Completed</p>
                    <p className="text-xs text-muted-foreground">October 15, 2024</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Successfully completed root canal on tooth #18. Patient tolerated procedure well.
                    </p>
                  </div>
                </div>
                
                <div className="relative pl-6 pb-8 border-l-2 border-primary/20">
                  <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-secondary"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Follow-up Appointment</p>
                    <p className="text-xs text-muted-foreground">September 20, 2024</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Checked healing progress. No complications observed.
                    </p>
                  </div>
                </div>
                
                <div className="relative pl-6 pb-8 border-l-2 border-primary/20">
                  <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-secondary"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Initial Diagnosis</p>
                    <p className="text-xs text-muted-foreground">August 10, 2024</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      X-ray revealed infection. Root canal treatment recommended.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="notes">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Activity className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Ongoing Treatment Plan</h4>
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Patient requires quarterly dental cleanings. Monitor gum health closely.
                        Continue antibacterial mouthwash usage for 3 months.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Allergies & Sensitivities</h4>
                        <Badge variant="destructive">Important</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Allergic to Penicillin. Use alternative antibiotics if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
