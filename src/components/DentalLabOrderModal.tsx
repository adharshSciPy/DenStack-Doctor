import React, { useState, useEffect } from 'react';
import { X, Building2, User, Calendar, DollarSign, FileText, Upload, Loader2 } from 'lucide-react';

interface DentalLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  patientId?: string;
  onSuccess?: () => void;
}

interface FormData {
  vendor: string;
  dentist: string;
  patientName: string;
  deliveryDate: string;
  price: string;
  note: string;
}

const DentalLabOrderModal: React.FC<DentalLabOrderModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'inhouse' | 'external' | 'aligner'>('inhouse');
  const [formData, setFormData] = useState<FormData>({
    vendor: '',
    dentist: '',
    patientName: '',
    deliveryDate: '',
    price: '',
    note: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [inhouseLabs, setInhouseLabs] = useState<any[]>([]);
  const [externalLabs, setExternalLabs] = useState<any[]>([]);
  const [alignerLabs, setAlignerLabs] = useState<any[]>([]);

  const tabs = [
    { id: 'inhouse' as const, label: 'In-House Lab' },
    { id: 'external' as const, label: 'External Lab' },
    { id: 'aligner' as const, label: 'Aligner Lab' }
  ];

  const currentLabs = activeTab === 'inhouse' 
    ? inhouseLabs 
    : activeTab === 'aligner' 
    ? alignerLabs 
    : externalLabs;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!formData.vendor || !formData.patientName || !formData.deliveryDate || !formData.price || !formData.note) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('vendor', formData.vendor);
      formDataToSend.append('dentist', formData.dentist);
      formDataToSend.append('patientName', formData.patientName);
      formDataToSend.append('deliveryDate', formData.deliveryDate);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('note', formData.note);
      if (appointmentId) {
        formDataToSend.append('appointmentId', appointmentId);
      }
      
      files.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      // Replace with your actual API endpoint
      const response = await fetch('/api/dental-lab-order', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Dental lab order created successfully');
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          vendor: '',
          dentist: '',
          patientName: '',
          deliveryDate: '',
          price: '',
          note: ''
        });
        setFiles([]);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating dental lab order:', error);
      alert('An error occurred while creating the order');
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
        <div style={{ 
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "white",
          position: "sticky",
          top: "73px",
          zIndex: 9
        }}>
          <div style={{ 
            display: "flex",
            padding: "0 24px"
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFormData(prev => ({ ...prev, vendor: "" }));
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
                  borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
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
                {activeTab === 'inhouse' 
                  ? 'In-House Lab *' 
                  : activeTab === 'aligner' 
                  ? 'Aligner Lab *' 
                  : 'External Lab *'}
              </label>
              {labsLoading ? (
                <div style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
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
                    Select {activeTab === 'inhouse' 
                      ? 'In-House Lab' 
                      : activeTab === 'aligner' 
                      ? 'Aligner Lab' 
                      : 'External Lab'}
                  </option>
                  {currentLabs.map((lab: any) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              )}
              {!labsLoading && currentLabs.length === 0 && (
                <div style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#ef4444",
                }}>
                  No labs found for this category
                </div>
              )}
            </div>

            {/* Dentist */}
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
                <User size={18} color="#6b7280" />
                Dentist
              </label>
              <select
                name="dentist"
                value={formData.dentist}
                onChange={handleSelectChange}
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
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor: any) => (
                  <option key={doctor._id} value={doctor.doctor._id}>
                    {doctor?.doctor?.name || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Name */}
            <div style={{ position: "relative" }}>
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
                <User size={18} color="#6b7280" />
                Patient Name *
              </label>
              <input
                type="text"
                name="patientName"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    patientName: e.target.value,
                  }));
                }}
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
                placeholder="Enter patient name"
              />

              {results.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "85px",
                    left: 0,
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: 0,
                    margin: 0,
                    listStyle: "none",
                    maxHeight: "200px",
                    overflowY: "auto",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    zIndex: 2000,
                  }}
                >
                  {results.map((p: any) => (
                    <li
                      key={p._id}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSearch(p.name);
                        setFormData((prev) => ({
                          ...prev,
                          patientName: p._id,
                        }));
                        setResults([]);
                      }}
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}

              {loading && search.length >= 3 && (
                <div style={{ marginTop: "5px", fontSize: "12px" }}>
                  Loading...
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
                min="0"
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
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#3b82f6")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#d1d5db")
                }
                placeholder="0.00"
              />
            </div>

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
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#3b82f6")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#d1d5db")
                }
                placeholder="Enter order notes or special instructions"
              />
            </div>

            {/* File Upload */}
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
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                !loading &&
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
              onMouseLeave={(e) =>
                !loading &&
                (e.currentTarget.style.backgroundColor = "#3b82f6")
              }
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalLabOrderModal;