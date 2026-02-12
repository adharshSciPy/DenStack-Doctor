// components/MedicineInput.jsx (Enhanced version)
import { useState, useEffect, useRef, useCallback } from 'react';
import { Pill, Plus, Check, X, ChevronDown } from 'lucide-react';
import { getMedicineSuggestions, createMedicine } from '../utils/medicineServices';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface MedicineSuggestion {
  _id: string;
  name: string;
  displayName?: string;
  genericName?: string;
  brandNames?: string[];
  dosageForms?: string[];
  strengths?: string[];
  category?: string;
  prescriptionRequired?: boolean;
  usageCount?: number;
  medicineId?: string;
}

export interface Medicine extends MedicineSuggestion {
  createdByDoctor?: string;
  clinicId?: string;
  isApproved?: boolean;
  lastUsed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onMedicineSelect?: (medicine: SelectedMedicine | null) => void;
  placeholder?: string;
  className?: string;
  doctorId?: string;
  clinicId?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;
}

interface NewMedicineData {
  name: string;
  dosageForms: string[];
  strengths: string[];
  category: string;
  prescriptionRequired: boolean;
}

export interface SelectedMedicine {
  medicineId: string;
  medicineName: string;
  name: string;
  displayName: string;
  genericName?: string;
  brandNames?: string[];
  dosageForms?: string[];
  strengths?: string[];
  category?: string;
  prescriptionRequired?: boolean;
}

const MedicineInput = ({
  value = '',
  onChange,
  onMedicineSelect,
  placeholder = "Search medicine...",
  className = '',
  doctorId,
  clinicId,
  autoFocus = false,
  name,
  id
}: MedicineInputProps) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineSuggestion | null>(null);
  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [newMedicineData, setNewMedicineData] = useState<NewMedicineData>({
    name: '',
    dosageForms: [],
    strengths: [],
    category: 'other',
    prescriptionRequired: true
  });
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
    itemRefs.current = new Array(suggestions.length + 1).fill(null);
  }, [suggestions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setShowSuggestions(true);

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(inputValue.trim());
    }, 250);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputValue]);

  const handleSelectSuggestion = useCallback((medicine: MedicineSuggestion) => {
    setInputValue(medicine.displayName || medicine.name);
    setSelectedMedicine(medicine);
    setSuggestions([]);
    setShowSuggestions(false);
    setCreatingNew(false);
    setHighlightedIndex(-1);
    
    onMedicineSelect?.({
      medicineId: medicine._id,
      medicineName: medicine.displayName || medicine.name,
      displayName: medicine.displayName || medicine.name,
      name: medicine.name,
      genericName: medicine.genericName,
      brandNames: medicine.brandNames,
      dosageForms: medicine.dosageForms,
      strengths: medicine.strengths,
      category: medicine.category,
      prescriptionRequired: medicine.prescriptionRequired
    });
  }, [onMedicineSelect]);

  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    try {
      const results = await getMedicineSuggestions(searchTerm.trim());

      // AUTO-SELECT when there is ONE exact match
      const normalized = searchTerm.trim().toLowerCase();
      if (
        results.length === 1 &&
        (
          results[0].name.toLowerCase() === normalized ||
          results[0].displayName?.toLowerCase() === normalized
        )
      ) {
        handleSelectSuggestion(results[0]);
        return;
      }

      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [handleSelectSuggestion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);
    setSelectedMedicine(null);
    setCreatingNew(false);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim()) {
      alert('Please enter a medicine name');
      return;
    }

    if (!doctorId) {
      alert('Doctor ID is required to create a new medicine.');
      return;
    }

    try {
      setLoading(true);
      
      const medicineData = {
        medicineName: inputValue.trim(),
        doctorId: doctorId,
        clinicId: clinicId,
        dosageForm: newMedicineData.dosageForms?.[0] || '',
        strength: newMedicineData.strengths?.[0] || '',
        category: newMedicineData.category,
        prescriptionRequired: newMedicineData.prescriptionRequired
      };

      const result = await createMedicine(medicineData);
      
      if (result.success && result.medicine) {
        const newMedicine: MedicineSuggestion = {
          _id: result.medicine._id,
          name: result.medicine.name,
          displayName: result.medicine.name,
          genericName: result.medicine.genericName,
          brandNames: result.medicine.brandNames,
          dosageForms: result.medicine.dosageForms,
          strengths: result.medicine.strengths,
          category: result.medicine.category,
          prescriptionRequired: result.medicine.prescriptionRequired
        };
        handleSelectSuggestion(newMedicine);
      } else {
        throw new Error(result.message || 'Failed to create medicine');
      }
    } catch (error: any) {
      console.error('Error creating medicine:', error);
      alert(error.message || 'Failed to create medicine. Please try again.');
    } finally {
      setLoading(false);
      setCreatingNew(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow Down: Open suggestions and highlight first item
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (!showSuggestions) {
        if (inputValue.length >= 2) {
          fetchSuggestions(inputValue);
          setShowSuggestions(true);
          setTimeout(() => setHighlightedIndex(0), 50);
        }
      } else {
        setHighlightedIndex(prev => {
          const maxIndex = suggestions.length > 0 
            ? (suggestions.length + (inputValue.length >= 2 ? 1 : 0) - 1) 
            : -1;
          return prev < maxIndex ? prev + 1 : 0;
        });
      }
      return;
    }

    // Arrow Up: Navigate up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (showSuggestions) {
        setHighlightedIndex(prev => {
          const maxIndex = suggestions.length > 0 
            ? (suggestions.length + (inputValue.length >= 2 ? 1 : 0) - 1) 
            : -1;
          return prev > 0 ? prev - 1 : maxIndex;
        });
      }
      return;
    }

    // Enter: Select highlighted item or first item
    if (e.key === 'Enter') {
      e.preventDefault();

      // If we have a highlighted item, select it
      if (highlightedIndex >= 0) {
        const totalItems = suggestions.length + (inputValue.length >= 2 ? 1 : 0);
        
        if (highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else if (highlightedIndex === suggestions.length && inputValue.length >= 2) {
          setCreatingNew(true);
          setShowSuggestions(false);
          setNewMedicineData(prev => ({ ...prev, name: inputValue }));
        }
        return;
      }

      // If suggestions exist and no highlight, select first
      if (showSuggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
        return;
      }

      // No suggestions but valid input → create new
      if (inputValue.trim().length >= 2 && !selectedMedicine) {
        setCreatingNew(true);
        setShowSuggestions(false);
      }
      return;
    }

    // Escape: Close dropdown
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    // Tab: Natural navigation, close suggestions
    if (e.key === 'Tab') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>, 
    medicine: MedicineSuggestion, 
    index: number
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectSuggestion(medicine);
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < suggestions.length + (inputValue.length >= 2 ? 1 : 0)) {
        setHighlightedIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
      }
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        setHighlightedIndex(prevIndex);
        itemRefs.current[prevIndex]?.focus();
      } else {
        inputRef.current?.focus();
        setHighlightedIndex(-1);
      }
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      antibiotic: 'bg-red-100 text-red-800',
      analgesic: 'bg-blue-100 text-blue-800',
      'anti-inflammatory': 'bg-purple-100 text-purple-800',
      antihistamine: 'bg-green-100 text-green-800',
      antacid: 'bg-yellow-100 text-yellow-800',
      vitamin: 'bg-orange-100 text-orange-800',
      steroid: 'bg-pink-100 text-pink-800',
      antifungal: 'bg-indigo-100 text-indigo-800',
      antiviral: 'bg-teal-100 text-teal-800',
      mouthwash: 'bg-cyan-100 text-cyan-800',
      'local-anesthetic': 'bg-gray-100 text-gray-800',
      fluoride: 'bg-emerald-100 text-emerald-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const handleClearInput = () => {
    setInputValue('');
    setSelectedMedicine(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setCreatingNew(false);
    setHighlightedIndex(-1);

    onChange?.('');
    onMedicineSelect?.(null);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const shouldShowClearButton = Boolean(selectedMedicine || inputValue);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Pill className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          name={name}
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 ${className} ${selectedMedicine ? 'border-green-500 bg-green-50' : ''}`}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-controls="medicine-suggestions-list"
          aria-expanded={showSuggestions}
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
          }
          role="combobox"
        />
        
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
        
        {shouldShowClearButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
            onClick={handleClearInput}
            aria-label="Clear input"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* SUGGESTIONS DROPDOWN */}
      {showSuggestions && (
        <div 
          id="medicine-suggestions-list"
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2"></div>
              Searching medicines...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((medicine, index) => (
                <div
                  key={medicine._id}
                  id={`suggestion-${index}`}
                  ref={el => { itemRefs.current[index] = el; }}
                  data-suggestion-item
                  tabIndex={0}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                    highlightedIndex === index ? 'bg-gray-100 ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectSuggestion(medicine)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, medicine, index)}
                  role="option"
                  aria-selected={selectedMedicine?._id === medicine._id}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {medicine.displayName || medicine.name}
                        </span>
                        {medicine.category && (
                          <Badge className={`text-xs ${getCategoryColor(medicine.category)}`}>
                            {medicine.category}
                          </Badge>
                        )}
                      </div>
                      
                      {medicine.genericName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Generic: {medicine.genericName}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {medicine.dosageForms?.slice(0, 2).map((form, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {form}
                          </span>
                        ))}
                        {medicine.strengths?.slice(0, 1).map((strength, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {strength}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {medicine.usageCount || 0} prescriptions
                        </span>
                        {medicine.prescriptionRequired && (
                          <span className="text-xs text-red-500">RX Required</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Option */}
              {inputValue.length >= 2 && (
                <div
                  id={`suggestion-${suggestions.length}`}
                  ref={el => { itemRefs.current[suggestions.length] = el; }}
                  data-suggestion-item
                  tabIndex={0}
                  className={`p-3 hover:bg-blue-50 cursor-pointer border-t border-blue-100 bg-blue-50/50 focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    highlightedIndex === suggestions.length ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setCreatingNew(true);
                    setShowSuggestions(false);
                    setNewMedicineData(prev => ({ ...prev, name: inputValue }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCreatingNew(true);
                      setShowSuggestions(false);
                      setNewMedicineData(prev => ({ ...prev, name: inputValue }));
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (suggestions.length > 0) {
                        setHighlightedIndex(suggestions.length - 1);
                      } else {
                        inputRef.current?.focus();
                      }
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      // Stay at current index
                    }
                  }}
                  role="option"
                >
                  <div className="flex items-center gap-2 text-blue-600">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">
                      Create: "{inputValue}"
                    </span>
                  </div>
                  <p className="text-xs text-blue-500 mt-1">
                    Add new medicine to database
                  </p>
                </div>
              )}
            </>
          ) : inputValue.length >= 2 ? (
            <div
              id="suggestion-0"
              ref={el => { itemRefs.current[0] = el; }}
              data-suggestion-item
              tabIndex={0}
              className={`p-4 hover:bg-blue-50 cursor-pointer focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                highlightedIndex === 0 ? 'bg-blue-100 ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                setCreatingNew(true);
                setNewMedicineData(prev => ({ ...prev, name: inputValue }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCreatingNew(true);
                  setNewMedicineData(prev => ({ ...prev, name: inputValue }));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  inputRef.current?.focus();
                }
              }}
              role="option"
            >
              <div className="flex items-center gap-2 text-blue-600">
                <Plus className="h-4 w-4" />
                <span className="font-medium">
                  Create new medicine: "{inputValue}"
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                No matches found. Click to add this medicine to the database.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Create New Medicine Form */}
      {creatingNew && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Add New Medicine</h4>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Medicine Name
              </label>
              <Input
                value={newMedicineData.name || inputValue}
                onChange={(e) => setNewMedicineData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Enter medicine name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCreatingNew(false);
                  }
                  if (e.key === 'Enter' && !loading && newMedicineData.name.trim()) {
                    handleCreateNew();
                  }
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={newMedicineData.category}
                  onChange={(e) => setNewMedicineData(prev => ({
                    ...prev,
                    category: e.target.value
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && newMedicineData.name.trim()) {
                      handleCreateNew();
                    }
                  }}
                >
                  <option value="antibiotic">Antibiotic</option>
                  <option value="analgesic">Analgesic</option>
                  <option value="anti-inflammatory">Anti-inflammatory</option>
                  <option value="antihistamine">Antihistamine</option>
                  <option value="antacid">Antacid</option>
                  <option value="vitamin">Vitamin</option>
                  <option value="steroid">Steroid</option>
                  <option value="antifungal">Antifungal</option>
                  <option value="antiviral">Antiviral</option>
                  <option value="mouthwash">Mouthwash</option>
                  <option value="local-anesthetic">Local Anesthetic</option>
                  <option value="fluoride">Fluoride</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prescription Required
                </label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={newMedicineData.prescriptionRequired.toString()}
                  onChange={(e) => setNewMedicineData(prev => ({
                    ...prev,
                    prescriptionRequired: e.target.value === 'true'
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && newMedicineData.name.trim()) {
                      handleCreateNew();
                    }
                  }}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatingNew(false);
                  setNewMedicineData({
                    name: '',
                    dosageForms: [],
                    strengths: [],
                    category: 'other',
                    prescriptionRequired: true
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateNew}
                disabled={loading || !newMedicineData.name.trim()}
              >
                {loading ? 'Adding...' : 'Add Medicine'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Medicine Info */}
      {selectedMedicine && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                {selectedMedicine.displayName || selectedMedicine.name}
              </span>
              {selectedMedicine.category && (
                <Badge className={`text-xs ${getCategoryColor(selectedMedicine.category)}`}>
                  {selectedMedicine.category}
                </Badge>
              )}
            </div>
            <span className="text-xs text-green-600">
              ✓ Ready to prescribe
            </span>
          </div>
          
          {selectedMedicine._id && (
            <input type="hidden" name="medicineId" value={selectedMedicine._id} />
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineInput;