import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  Loader2,
} from "lucide-react";
import labBaseUrl from "../labBaseUrl";
import axios from "axios";

interface DentalLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  patientId?: string;
  clinicId?: string;
  onSuccess?: () => void;
  doctorId?: string;
}

interface FormData {
  vendor: string;
  deliveryDate: string;
  price: string;
  note: string;
  trays: {
    upperArch: number;
    lowerArch: number;
  };
  stlFiles: {
    upper?: File;
    lower?: File;
    total?: File;
  };
}

interface Lab {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

const DentalLabOrderModal: React.FC<DentalLabOrderModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  clinicId,
  doctorId,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<
    "inhouse" | "external" | "aligner"
  >("inhouse");
  const [formData, setFormData] = useState<FormData>({
    vendor: "",
    deliveryDate: "",
    price: "",
    note: "",
    trays: {
      upperArch: 0,
      lowerArch: 0,
    },
    stlFiles: {
      upper: undefined,
      lower: undefined,
      total: undefined,
    },
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(false);
  const [inhouseLabs, setInhouseLabs] = useState<Lab[]>([]);
  const [externalLabs, setExternalLabs] = useState<Lab[]>([]);
  const [alignerLabs, setAlignerLabs] = useState<Lab[]>([]);

  const tabs = [
    { id: "inhouse" as const, label: "In-House Lab" },
    { id: "external" as const, label: "External Lab" },
    { id: "aligner" as const, label: "Aligner Lab" },
  ];

  const currentLabs =
    activeTab === "inhouse"
      ? inhouseLabs
      : activeTab === "aligner"
        ? alignerLabs
        : externalLabs;

  // Reset form when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        vendor: "",
        deliveryDate: "",
        price: "",
        note: "",
        trays: {
          upperArch: 0,
          lowerArch: 0,
        },
        stlFiles: {
          upper: undefined,
          lower: undefined,
          total: undefined,
        },
      });
      setFiles([]);
    }
  }, [isOpen, activeTab]);

  // Fetch labs based on active tab
  const fetchLabsByType = async (labType: string) => {
    if (!clinicId && labType === "inhouse") {
      console.error("Clinic ID is required for in-house labs");
      return;
    }

    setLabsLoading(true);
    try {
      let endpoint = "";

      switch (labType) {
        case "inhouse":
          endpoint = `${labBaseUrl}/api/v1/lab/inhouse-labs-by-clinic/${clinicId}`;
          break;
        case "external":
          endpoint = `${labBaseUrl}/api/v1/lab/external-vendors`;
          break;
        case "aligner":
          endpoint = `${labBaseUrl}/api/v1/lab/aligner-vendors`;
          break;
        default:
          endpoint = `${labBaseUrl}/api/v1/lab/vendors`;
      }

      const res = await axios.get(endpoint);

      switch (labType) {
        case "inhouse":
          setInhouseLabs(res.data.data || res.data);
          break;
        case "external":
          setExternalLabs(res.data.data || res.data);
          break;
        case "aligner":
          setAlignerLabs(res.data.data || res.data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${labType} labs:`, error);
    } finally {
      setLabsLoading(false);
    }
  };

  // Fetch labs when tab changes or clinicId changes
  useEffect(() => {
    if (isOpen && clinicId) {
      fetchLabsByType(activeTab);
    }
  }, [activeTab, clinicId, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.vendor) {
      alert("Please select a lab");
      return;
    }
    if (!patientId) {
      alert("Patient ID is required");
      return;
    }
    if (!formData.deliveryDate) {
      alert("Please select delivery date");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price");
      return;
    }
    if (!formData.note.trim()) {
      alert("Please enter order notes");
      return;
    }

    // Aligner-specific validation
    if (activeTab === "aligner") {
      if (formData.trays.upperArch <= 0 && formData.trays.lowerArch <= 0) {
        alert("Please enter number of trays for at least one arch");
        return;
      }
      if (!formData.stlFiles.upper && !formData.stlFiles.lower) {
        alert("Please upload STL files for at least one arch");
        return;
      }
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("labType", activeTab);
      formDataToSend.append("clinicId", clinicId || "");

      // Handle different lab types
      if (activeTab === "aligner") {
        // For aligner orders
        formDataToSend.append("vendorId", formData.vendor);
        formDataToSend.append("patientId", patientId);
        formDataToSend.append("doctorName", doctorId || "");
        formDataToSend.append("upperArch", formData.trays.upperArch.toString());
        formDataToSend.append("lowerArch", formData.trays.lowerArch.toString());
        formDataToSend.append("totalAmount", formData.price);
        formDataToSend.append("note", formData.note);
        formDataToSend.append("deliveryDate", formData.deliveryDate);

        if (appointmentId) {
          formDataToSend.append("appointmentId", appointmentId);
        }

        // Append STL files with specific keys
        if (formData.stlFiles.upper) {
          formDataToSend.append("upperFile", formData.stlFiles.upper);
        }
        if (formData.stlFiles.lower) {
          formDataToSend.append("lowerFile", formData.stlFiles.lower);
        }
        if (formData.stlFiles.total) {
          formDataToSend.append("totalJaw", formData.stlFiles.total);
        }

        // Append any additional files for aligner orders
        files.forEach((file) => {
          formDataToSend.append("attachments", file);
        });

        // Use aligner-specific endpoint
        const response = await axios.post(
          `${labBaseUrl}/api/v1/aligners/create-order`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.status === 200 || response.status === 201) {
          alert("Aligner order created successfully!");
          onSuccess?.();
          onClose();
        }
      } else {
        // For inhouse and external lab orders
        formDataToSend.append("vendor", formData.vendor);
        formDataToSend.append("dentist", doctorId || "");
        formDataToSend.append("patientName", patientId);
        formDataToSend.append("deliveryDate", formData.deliveryDate);
        formDataToSend.append("price", formData.price);
        formDataToSend.append("note", formData.note);
        
        if (appointmentId) {
          formDataToSend.append("appointmentId", appointmentId);
        }

        // Append files for non-aligner orders
        files.forEach((file) => {
          formDataToSend.append("attachments", file);
        });

        const response = await axios.post(
          `${labBaseUrl}/api/v1/lab-orders/dental-orders`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.status === 200 || response.status === 201 || response.data?.success) {
          alert("Dental lab order created successfully!");
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error occurred";
      alert("Error creating order: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 10,
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                margin: 0,
              }}
            >
              Create Dental Lab Order
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f3f4f6")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <X size={24} color="#6b7280" />
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "white",
              position: "sticky",
              top: "73px",
              zIndex: 9,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "0 24px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFormData((prev) => ({ 
                      ...prev, 
                      vendor: "",
                      trays: {
                        upperArch: 0,
                        lowerArch: 0,
                      },
                      stlFiles: {
                        upper: undefined,
                        lower: undefined,
                        total: undefined,
                      },
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                    borderBottom:
                      activeTab === tab.id
                        ? "2px solid #3b82f6"
                        : "2px solid transparent",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = "#6b7280";
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gap: "20px" }}>
              {/* Lab Selection */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <Building2 size={18} color="#6b7280" />
                  {activeTab === "inhouse"
                    ? "In-House Lab *"
                    : activeTab === "aligner"
                      ? "Aligner Lab *"
                      : "External Lab *"}
                </label>
                {labsLoading ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" />
                    Loading labs...
                  </div>
                ) : (
                  <select
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleSelectChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                  >
                    <option value="">
                      Select{" "}
                      {activeTab === "inhouse"
                        ? "In-House Lab"
                        : activeTab === "aligner"
                          ? "Aligner Lab"
                          : "External Lab"}
                    </option>
                    {currentLabs.map((lab: Lab) => (
                      <option key={lab._id} value={lab._id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                )}
                {!labsLoading && currentLabs.length === 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#ef4444",
                    }}
                  >
                    No {activeTab} labs found
                    {activeTab === "inhouse" && " for this clinic"}
                  </div>
                )}
              </div>

              {/* Delivery Date */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <Calendar size={18} color="#6b7280" />
                  Delivery Date *
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                />
              </div>

              {/* Price */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <DollarSign size={18} color="#6b7280" />
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                  placeholder="0.00"
                />
              </div>

              {/* Aligner-specific fields */}
              {activeTab === "aligner" && (
                <>
                  {/* Trays Section */}
                  <div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "12px",
                      }}
                    >
                      <FileText size={18} color="#6b7280" />
                      Number of Trays *
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {/* Upper Arch Trays */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Upper Arch
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.trays.upperArch}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              trays: {
                                ...prev.trays,
                                upperArch: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          required
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s",
                            boxSizing: "border-box",
                          }}
                          placeholder="0"
                        />
                      </div>

                      {/* Lower Arch Trays */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Lower Arch
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.trays.lowerArch}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              trays: {
                                ...prev.trays,
                                lowerArch: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          required
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s",
                            boxSizing: "border-box",
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STL Files Upload - Separate fields for aligner */}
                  <div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "12px",
                      }}
                    >
                      <Upload size={18} color="#6b7280" />
                      STL Files *
                    </label>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {/* Upper Jaw STL */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Upper Jaw STL *
                        </label>
                        <input
                          type="file"
                          accept=".stl,.STL"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                stlFiles: {
                                  ...prev.stlFiles,
                                  upper: file,
                                },
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "white",
                            cursor: "pointer",
                            boxSizing: "border-box",
                          }}
                        />
                        {formData.stlFiles.upper && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            Selected: {formData.stlFiles.upper.name}
                          </div>
                        )}
                      </div>

                      {/* Lower Jaw STL */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Lower Jaw STL *
                        </label>
                        <input
                          type="file"
                          accept=".stl,.STL"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                stlFiles: {
                                  ...prev.stlFiles,
                                  lower: file,
                                },
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "white",
                            cursor: "pointer",
                            boxSizing: "border-box",
                          }}
                        />
                        {formData.stlFiles.lower && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            Selected: {formData.stlFiles.lower.name}
                          </div>
                        )}
                      </div>

                      {/* Total Jaw STL */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Total Jaw STL (Optional)
                        </label>
                        <input
                          type="file"
                          accept=".stl,.STL"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                stlFiles: {
                                  ...prev.stlFiles,
                                  total: file,
                                },
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "white",
                            cursor: "pointer",
                            boxSizing: "border-box",
                          }}
                        />
                        {formData.stlFiles.total && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            Selected: {formData.stlFiles.total.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Note */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <FileText size={18} color="#6b7280" />
                  Note *
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                  placeholder="Enter order notes or special instructions"
                />
              </div>

              {/* File Upload - For non-aligner orders */}
              {activeTab !== "aligner" && (
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Upload size={18} color="#6b7280" />
                    Attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.stl"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      backgroundColor: "white",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  />
                  {files.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      {files.length} file(s) selected
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "32px",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || labsLoading}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: loading || labsLoading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading || labsLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) =>
                  !loading && !labsLoading && (e.currentTarget.style.backgroundColor = "#2563eb")
                }
                onMouseLeave={(e) =>
                  !loading && !labsLoading && (e.currentTarget.style.backgroundColor = "#3b82f6")
                }
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DentalLabOrderModal;