// src/pages/DoctorAuth.tsx
import { useState, useEffect } from "react";
import { Heart, User, Lock, Mail, Phone, Stethoscope, IdCard } from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

interface DoctorRegistrationData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  specialization: string;
  licenseNumber: string;
  confirmPassword?: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Storage keys to match the ones in App.tsx
const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ROLE: "userRole",
  DOCTOR_ID: "doctorId",
  CLINIC_ID: "clinicId",
  IS_HYBRID: "isHybrid",
} as const;

export default function DoctorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Login state
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: ""
  });

  // Registration state
  const [regData, setRegData] = useState<DoctorRegistrationData>({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    specialization: "",
    licenseNumber: "",
    confirmPassword: ""
  });

  // Check for auto-login parameters on mount
// Check for auto-login parameters on mount
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const role = params.get("role");
  const doctorId = params.get("doctorId");
  const clinicId = params.get("clinicId");
  const isHybrid = params.get("isHybrid") === "true";

  console.log("🔍 DoctorLogin - checking URL params:", { token, role, doctorId, clinicId, isHybrid });

  if (token && role && doctorId) {
    console.log("🔄 Auto-login detected from URL params");
    
    // Clear any existing data
    clearStorage();

    // Store auth data
    setStorageValue(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setStorageValue(STORAGE_KEYS.USER_ROLE, role, true);
    setStorageValue(STORAGE_KEYS.DOCTOR_ID, doctorId, true);
    setStorageValue(STORAGE_KEYS.IS_HYBRID, String(isHybrid), true);
    
    if (clinicId) {
      setStorageValue(STORAGE_KEYS.CLINIC_ID, clinicId, true);
    }

    // Dispatch login event for any listeners
    window.postMessage({
      type: 'LOGIN_DATA',
      token,
      role,
      doctorId,
      clinicId,
      isHybrid
    }, 'http://localhost:3001');

    // Navigate to dashboard
    navigate("/dashboard", { replace: true });
  } else {
    console.log("🔍 No auto-login params found, showing login form");
  }
}, [location, navigate]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegData({
      ...regData,
      [e.target.name]: e.target.value
    });
  };

  const validateRegistration = (): boolean => {
    if (!regData.name || regData.name.length < 2) {
      setError("Name must be at least 2 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(regData.phoneNumber.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    if (regData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (regData.password !== regData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!regData.specialization) {
      setError("Please enter your specialization");
      return false;
    }

    if (!regData.licenseNumber) {
      setError("License number is required");
      return false;
    }

    return true;
  };

  const setStorageValue = (key: string, value: string, persistent = true) => {
    sessionStorage.setItem(key, value);
    if (persistent) {
      localStorage.setItem(key, value);
    }
  };

  const clearStorage = () => {
    sessionStorage.clear();
    localStorage.clear();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8001/api/v1/auth/doctor/login",
        loginData
      );

      if (response.status === 200) {
        console.log("✅ Login successful:", response.data);
        
        // Clear any existing data
        clearStorage();

        const { accessToken, doctor } = response.data;
        const isHybrid = doctor.isHybrid || false;
        const clinicId = response.data.clinic?.id || doctor.clinicId || null;

        // Store auth data using the same keys as App.tsx
        setStorageValue(STORAGE_KEYS.AUTH_TOKEN, accessToken, true);
        setStorageValue(STORAGE_KEYS.USER_ROLE, doctor.role || "600", true);
        setStorageValue(STORAGE_KEYS.DOCTOR_ID, doctor.id, true);
        setStorageValue(STORAGE_KEYS.IS_HYBRID, String(isHybrid), true);
        
        if (clinicId) {
          setStorageValue(STORAGE_KEYS.CLINIC_ID, clinicId, true);
        }

        // Dispatch login event for any listeners
        window.postMessage({
          type: 'LOGIN_DATA',
          token: accessToken,
          role: doctor.role || "600",
          doctorId: doctor.id,
          clinicId,
          isHybrid
        }, 'http://localhost:3001');

        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Login failed. Please check your credentials.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegistration()) {
      return;
    }

    setError(null);
    setLoading(true);

    // Remove confirmPassword before sending
    const { confirmPassword, ...registrationData } = regData;

    try {
      const response = await axios.post(
        "http://localhost:8001/api/v1/auth/doctor/register",
        registrationData
      );

      if (response.status === 201) {
        console.log("✅ Registration successful:", response.data);
        
        // Auto-fill login form and switch to login
        setLoginData({
          email: regData.email,
          password: regData.password
        });
        
        setIsLogin(true);
        setError("Registration successful! Please login with your credentials.");
        
        // Clear registration form
        setRegData({
          name: "",
          email: "",
          phoneNumber: "",
          password: "",
          specialization: "",
          licenseNumber: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Doctor Portal
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Welcome back! Please login to your account" : "Join us! Create your doctor account"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Toggle Buttons */}
          <div className="flex p-1 bg-gray-100/80 m-4 rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isLogin
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                !isLogin
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error/Success Message */}
          {error && (
            <div className={`mx-6 p-4 rounded-lg ${
              error.includes("successful") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {error}
            </div>
          )}

          {/* Forms */}
          <div className="p-6">
            {isLogin ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="doctor@hospital.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Sign In"}
                </button>
              </form>
            ) : (
              // Registration Form
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={regData.name}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Dr. John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={regData.email}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="doctor@hospital.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={regData.phoneNumber}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="specialization"
                        value={regData.specialization}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Cardiology"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={regData.licenseNumber}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="MED-12345"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={regData.password}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Min. 6 characters"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={regData.confirmPassword}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? "Register here" : "Login here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}