// src/pages/DoctorAuth.tsx
import { useState, useEffect } from "react";
import { 
  Heart, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Stethoscope, 
  IdCard,
  Eye, 
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  Shield,
  Smartphone
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import baseUrl from "../baseUrl"


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

// Storage keys to match the ones in App.tsx - MUST BE EXACTLY THE SAME
const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ROLE: "userRole",
  DOCTOR_ID: "doctorId",
  CLINIC_ID: "clinicId",
  IS_HYBRID: "isHybrid",
  ACTIVE_MODE: "activeMode",
} as const;

export default function DoctorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
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

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
const [resetStep, setResetStep] = useState(1);

const [resetData, setResetData] = useState({
  email: "",
  otp: "",
  newPassword: "",
});

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
      toast.showInfo("Auto-logging you in...");
      // Clear any existing data first
      clearAllAuthData();

      // Store auth data - ALWAYS store in both storages for consistency
      // The App.tsx checks both, so we should store in both to ensure it's found
      setStorageValueInBoth(STORAGE_KEYS.AUTH_TOKEN, token);
      setStorageValueInBoth(STORAGE_KEYS.USER_ROLE, role);
      setStorageValueInBoth(STORAGE_KEYS.DOCTOR_ID, doctorId);
      setStorageValueInBoth(STORAGE_KEYS.IS_HYBRID, String(isHybrid));
      setStorageValueInBoth(STORAGE_KEYS.ACTIVE_MODE, 'doctor');
      
      if (clinicId) {
        setStorageValueInBoth(STORAGE_KEYS.CLINIC_ID, clinicId);
      }
 toast.showSuccess("Auto-login successful! Welcome back.");
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
    }
  }, [location, navigate,toast]);

  // Update password strength when password changes
  useEffect(() => {
    if (regData.password) {
      setPasswordStrength({
        hasMinLength: regData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(regData.password),
        hasLowerCase: /[a-z]/.test(regData.password),
        hasNumber: /[0-9]/.test(regData.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(regData.password)
      });
    } else {
      setPasswordStrength({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
    }
  }, [regData.password]);

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
       const errorMsg = "Name must be at least 2 characters long";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) {
        const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(regData.phoneNumber.replace(/\D/g, ''))) {
    const errorMsg = "Please enter a valid 10-digit phone number";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    if (regData.password.length < 8) {
    const errorMsg = "Password must be at least 8 characters long for security";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    // Check password strength
    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    if (strengthCount < 3) {
      const errorMsg = "Please use a stronger password (mix of uppercase, lowercase, numbers, and special characters)";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    if (regData.password !== regData.confirmPassword) {
       const errorMsg = "Passwords do not match";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    if (!regData.specialization) {
      const errorMsg = "Please enter your specialization";
      setError(errorMsg);
      toast.showError(errorMsg)
      return false;
    }

    if (!regData.licenseNumber) {
       const errorMsg = "License number is required";
      setError(errorMsg);
      toast.showError(errorMsg);
      return false;
    }

    return true;
  };

  // Helper function to set in both storages
  const setStorageValueInBoth = (key: string, value: string) => {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
    console.log(`💾 Stored ${key} in both storages:`, value);
  };

  // Clear all auth data from both storages
  const clearAllAuthData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    console.log("🧹 Cleared all auth data from both storages");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
const loadingToastId = toast.showLoading("Logging in...");
    try {
      console.log("🔐 Attempting login with:", loginData.email);
      
      const response = await axios.post(
        `${baseUrl}api/v1/auth/doctor/login`,
        loginData
      );

      if (response.status === 200) {
        console.log("✅ Login successful:", response.data);
        
        // Clear any existing data first
        clearAllAuthData();

        const { accessToken, doctor } = response.data;
        const isHybrid = doctor.isHybrid || false;
        const clinicId = response.data.clinic?.id || doctor.clinicId || null;

        // IMPORTANT: Store in BOTH localStorage AND sessionStorage
        // The App.tsx checks both, so we need to ensure it's available in both
        setStorageValueInBoth(STORAGE_KEYS.AUTH_TOKEN, accessToken);
        setStorageValueInBoth(STORAGE_KEYS.USER_ROLE, doctor.role || "600");
        setStorageValueInBoth(STORAGE_KEYS.DOCTOR_ID, doctor.id);
        setStorageValueInBoth(STORAGE_KEYS.IS_HYBRID, String(isHybrid));
        setStorageValueInBoth(STORAGE_KEYS.ACTIVE_MODE, 'doctor');
        
        if (clinicId) {
          setStorageValueInBoth(STORAGE_KEYS.CLINIC_ID, clinicId);
        }

        // Verify storage was set correctly
        console.log("🔍 Verifying storage after login:", {
          sessionToken: sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          localToken: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          sessionRole: sessionStorage.getItem(STORAGE_KEYS.USER_ROLE),
          localRole: localStorage.getItem(STORAGE_KEYS.USER_ROLE),
          sessionDoctorId: sessionStorage.getItem(STORAGE_KEYS.DOCTOR_ID),
          localDoctorId: localStorage.getItem(STORAGE_KEYS.DOCTOR_ID),
        });
 toast.dismiss(loadingToastId);
        toast.showSuccess(`Welcome back, Dr. ${doctor.name || 'Doctor'}!`);
        // Dispatch login event for any listeners
        window.postMessage({
          type: 'LOGIN_DATA',
          token: accessToken,
          role: doctor.role || "600",
          doctorId: doctor.id,
          clinicId,
          isHybrid
        }, 'http://localhost:3001');

        // Small delay to ensure storage is written before navigation
        setTimeout(() => {
          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
        }, 100);
      }
    } catch (error) {
        console.error("Login failed:", error);
      toast.dismiss(loadingToastId);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
        setError(errorMessage);
        toast.showError(errorMessage);
      } else {
         const errorMessage = "Login failed. Please try again.";
        setError(errorMessage);
        toast.showError(errorMessage);
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
    setSuccessMessage(null);
    setLoading(true);
 const loadingToastId = toast.showLoading("Creating your account...");
    // Remove confirmPassword before sending
    const { confirmPassword, ...registrationData } = regData;

    try {
      const response = await axios.post(
        `${baseUrl}api/v1/auth/doctor/register`,
        registrationData
      );

      if (response.status === 201) {
        console.log("✅ Registration successful:", response.data);
          toast.dismiss(loadingToastId);
        toast.showSuccess("Registration successful! Please login with your credentials.");
        setSuccessMessage("Registration successful! Please login with your credentials.");
        
        // Auto-fill login form
        setLoginData({
          email: regData.email,
          password: regData.password
        });
         toast.showInfo("Login form has been auto-filled for you.");
        // Switch to login after 2 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage(null);
        }, 2000);
        
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

       toast.dismiss(loadingToastId);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
        setError(errorMessage);
        toast.showError(errorMessage);
      } else {
               const errorMessage = "Registration failed. Please try again.";
        setError(errorMessage);
        toast.showError(errorMessage);

      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength === 0) return "bg-gray-200";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength === 0) return "Enter password";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Medium";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };
const sendOTP = async () => {
  try {
    setLoading(true);

    await axios.post(
      `${baseUrl}api/v1/auth/doctor/forgot-password`,
      { email: resetData.email }
    );

    toast.showSuccess("OTP sent to your email");
    setResetStep(2);

  } catch (err:any) {
    toast.showError(err.response?.data?.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};
const resetPassword = async () => {
  try {
    setLoading(true);

    await axios.post(
      `${baseUrl}api/v1/auth/doctor/reset-password`,
      {
        email: resetData.email,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
      }
    );

    toast.showSuccess("Password reset successful");

    setShowForgotPassword(false);
    setResetStep(1);

  } catch (err:any) {
    toast.showError(err.response?.data?.message || "Reset failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-200/50">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Doctor Portal
          </h1>
          <p className="text-gray-600 text-lg">
            {isLogin 
              ? "Secure access to your medical practice dashboard" 
              : "Join our network of healthcare professionals"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* Toggle Buttons */}
          <div className="flex p-1.5 bg-gray-100/80 m-6 rounded-xl">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                isLogin
                  ? "bg-white text-blue-600 shadow-md shadow-blue-200/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                !isLogin
                  ? "bg-white text-blue-600 shadow-md shadow-blue-200/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              Register
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Features Bar - Only show on login */}
          {/* {isLogin && (
            <div className="mx-6 mb-6 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-700">Schedule Mgmt</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700">Mobile Access</span>
              </div>
            </div>
          )} */}

          {/* Forms */}
          <div className="p-6 pt-0">
            {isLogin ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="doctor@hospital.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="w-full pl-10 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
  type="button"
  onClick={() => setShowForgotPassword(true)}
  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
>
  Forgot password?
</button>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
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
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={regData.name}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Dr. John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={regData.email}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="doctor@hospital.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={regData.phoneNumber}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <div className="relative group">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="specialization"
                        value={regData.specialization}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Cardiology"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <div className="relative group">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={regData.licenseNumber}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="MED-12345"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={regData.password}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Min. 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {regData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                              style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>8+ characters</span>
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>Uppercase</span>
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>Lowercase</span>
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>Number</span>
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>Special char</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={regData.confirmPassword}
                        onChange={handleRegChange}
                        className="w-full pl-10 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Re-enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {regData.confirmPassword && (
                      <div className={`mt-1 text-xs flex items-center gap-1 ${
                        regData.password === regData.confirmPassword 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {regData.password === regData.confirmPassword ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Secure Registration</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Your information is encrypted and protected. We comply with healthcare data protection standards.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              {isLogin ? "New to our platform? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 mb-3">Trusted by healthcare professionals nationwide</p>
          <div className="flex items-center justify-center gap-6 opacity-50">
            <Building2 className="w-6 h-6 text-gray-400" />
            <Heart className="w-6 h-6 text-gray-400" />
            <Stethoscope className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>
{showForgotPassword && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-white p-6 rounded-xl w-full max-w-md">

<h2 className="text-xl font-semibold mb-4">
Reset Password
</h2>

{/* STEP 1 EMAIL */}
{resetStep === 1 && (
<>
<input
type="email"
placeholder="Enter your email"
className="w-full border p-3 rounded-lg mb-4"
value={resetData.email}
onChange={(e)=>setResetData({...resetData,email:e.target.value})}
/>

<button
onClick={sendOTP}
className="w-full bg-blue-600 text-white py-3 rounded-lg"
>
Send OTP
</button>
</>
)}

{/* STEP 2 OTP + PASSWORD */}
{resetStep === 2 && (
<>
<input
type="text"
placeholder="Enter OTP"
className="w-full border p-3 rounded-lg mb-3"
value={resetData.otp}
onChange={(e)=>setResetData({...resetData,otp:e.target.value})}
/>

<input
type="password"
placeholder="New Password"
className="w-full border p-3 rounded-lg mb-4"
value={resetData.newPassword}
onChange={(e)=>setResetData({...resetData,newPassword:e.target.value})}
/>

<button
onClick={resetPassword}
className="w-full bg-green-600 text-white py-3 rounded-lg"
>
Reset Password
</button>
</>
)}

<button
className="mt-4 text-sm text-gray-500"
onClick={()=>setShowForgotPassword(false)}
>
Cancel
</button>

</div>
</div>
)}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}