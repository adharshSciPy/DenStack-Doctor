import { Plus, FileText, Send, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";

interface Prescription {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  duration: string;
  status: "pending" | "approved" | "sent";
}

const mockPrescriptions: Prescription[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    medication: "Amoxicillin",
    dosage: "500mg, 3 times daily",
    duration: "7 days",
    status: "approved"
  },
  {
    id: "2",
    patientName: "Michael Chen",
    medication: "Ibuprofen",
    dosage: "400mg, as needed",
    duration: "5 days",
    status: "pending"
  },
];

export function EPrescription() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const handleShare = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShareDialogOpen(true);
  };

  const handleSendEmail = () => {
    // Mock email send
    console.log("Sending via email...");
    setShareDialogOpen(false);
  };

  const handleSendWhatsApp = () => {
    // Mock WhatsApp send
    console.log("Sending via WhatsApp...");
    setShareDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>E-Prescription & Treatment Plans</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Prescription</DialogTitle>
                  <DialogDescription>
                    Fill out the prescription details for your patient
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patient">Patient Name</Label>
                    <Input id="patient" placeholder="Search patient..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="medication">Medication</Label>
                    <Input id="medication" placeholder="Enter medication name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input id="dosage" placeholder="e.g., 500mg" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select>
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once daily</SelectItem>
                          <SelectItem value="twice">Twice daily</SelectItem>
                          <SelectItem value="thrice">3 times daily</SelectItem>
                          <SelectItem value="needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" placeholder="e.g., 7 days" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Enter any special instructions..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-primary hover:bg-primary/90">Create & Approve</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border rounded-lg p-4 hover:bg-[var(--hover)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">{prescription.patientName}</h4>
                      <Badge
                        className={
                          prescription.status === "approved"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : prescription.status === "sent"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {prescription.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Medication:</span>
                        <p className="font-medium">{prescription.medication}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dosage:</span>
                        <p className="font-medium">{prescription.dosage}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">{prescription.duration}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {prescription.status === "pending" && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(prescription)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Post-Surgery Care</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Antibiotics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Pain Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Treatment Plan</DialogTitle>
            <DialogDescription>
              Choose how to share this prescription with {selectedPrescription?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={handleSendEmail}
            >
              <Mail className="mr-4 h-6 w-6" />
              <div className="text-left">
                <p className="font-medium">Send via Email</p>
                <p className="text-sm text-muted-foreground">
                  Send prescription to patient's registered email
                </p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-4 h-6 w-6" />
              <div className="text-left">
                <p className="font-medium">Send via WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Send prescription to patient's WhatsApp
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
