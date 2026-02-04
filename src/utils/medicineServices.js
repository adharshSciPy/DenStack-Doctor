// services/medicineService.js
import axios from 'axios';
import patientServiceBaseUrl from '../patientServiceBaseUrl.js';

/**
 * Get medicine suggestions from API
 */
export const getMedicineSuggestions = async (searchTerm, limit = 15) => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/medicine/suggestions`,
      {
        params: { 
          q: searchTerm, 
          limit 
        },
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      }
    );
    
    return response.data.suggestions || response.data || [];
  } catch (error) {
    console.error('Error fetching medicine suggestions:', error);
    return [];
  }
};

/**
 * Get popular medicines
 */
export const getPopularMedicines = async (limit = 20) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/medicine/popular`,
      {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data.medicines || response.data || [];
  } catch (error) {
    console.error('Error fetching popular medicines:', error);
    return [];
  }
};

/**
 * Create new medicine
 */
export const createMedicine = async (medicineData) => {
  try {
    // const token = localStorage.getItem('authToken');
    const response = await axios.post(
      `${patientServiceBaseUrl}/api/v1/patient-service/medicine/create`,
      medicineData,
      // {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating medicine:', error);
    throw error;
  }
};

/**
 * Search medicines
 */
export const searchMedicines = async (searchTerm, page = 1, limit = 20) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/medicine/search`,
      {
        params: { 
          search: searchTerm, 
          page, 
          limit 
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error searching medicines:', error);
    return { data: [], total: 0, page: 1, limit: 20 };
  }
};