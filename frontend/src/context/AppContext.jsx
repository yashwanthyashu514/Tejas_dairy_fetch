import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AppContext = createContext(null);

/* ──────────────────────────────────
   Aggressive URL Sanitization
────────────────────────────────── */
let rawEnv = import.meta.env.VITE_BASE_URL;

let cleanUrl =
  typeof rawEnv === "string" ? rawEnv.replace(/['"]/g, "").trim() : "";

if (!cleanUrl) {
  cleanUrl = "http://localhost:5000";
} else if (!/^https?:\/\//i.test(cleanUrl)) {
  cleanUrl = `http://${cleanUrl}`;
}

try {
  new URL(cleanUrl);
} catch (err) {
  console.warn(
    `[Tejas Dairy] VITE_BASE_URL is invalid. Falling back to localhost.`,
  );
  cleanUrl = "http://localhost:5000";
}

const axiosInstance = axios.create({
  baseURL: cleanUrl,
  withCredentials: true,
});

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  // Read token exactly once on mount
  const [userToken, setUserTokenState] = useState(
    () => localStorage.getItem("userToken") || "",
  );
  const [userData, setUserData] = useState(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const interceptorRef = useRef(null);

  // Persist token to localStorage whenever it changes
  const setUserToken = useCallback((token) => {
    setUserTokenState(token);
    if (token) {
      localStorage.setItem("userToken", token);
    } else {
      localStorage.removeItem("userToken");
    }
  }, []);

  // Attach / refresh auth interceptor whenever token changes
  useEffect(() => {
    if (interceptorRef.current !== null) {
      axiosInstance.interceptors.request.eject(interceptorRef.current);
    }
    interceptorRef.current = axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("userToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
    );
  }, [userToken]);

  // Response interceptor — auto-logout on 401 Unauthorized
  useEffect(() => {
    const id = axiosInstance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          setUserToken("");
          setUserData(null);
          // Only navigate to login if we aren't already validating the initial load
          navigate("/login");
        }
        return Promise.reject(err);
      },
    );
    return () => axiosInstance.interceptors.response.eject(id);
  }, [navigate, setUserToken]);

  // Validate token on app load
  const validateToken = useCallback(async () => {
    const stored = localStorage.getItem("userToken");
    if (!stored) {
      setIsValidatingToken(false);
      return;
    }

    try {
      // NOTE: Make sure "/api/owner/profile" is the correct endpoint!
      // If your backend uses something like "/api/owner/get-profile", change it here.
      const { data } = await axiosInstance.get("/api/owner/profile");

      if (data.success) {
        setUserData(data.data || data.userData);
      } else {
        // Only clear if the server explicitly tells us the JWT is expired/invalid
        if (
          data.message === "jwt expired" ||
          data.message?.includes("authorized")
        ) {
          setUserToken("");
        }
      }
    } catch (error) {
      // FIX: Only clear the token if the backend threw a 401 (Unauthorized)
      // Do NOT clear the token for network errors, 404s, or 500s!
      if (error.response?.status === 401) {
        setUserToken("");
      } else {
        console.warn(
          "Validation request failed, but keeping token:",
          error.message,
        );
      }
    } finally {
      setIsValidatingToken(false);
    }
  }, [setUserToken]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Generic authorized API call
  const apiRequest = useCallback(
    async (method, url, data = null, params = null) => {
      const config = { method, url };
      if (data) config.data = data;
      if (params) config.params = params;
      const res = await axiosInstance(config);
      return res.data;
    },
    [],
  );

  const logout = useCallback(() => {
    setUserToken("");
    setUserData(null);
    toast.success("Logged out securely.");
    navigate("/login");
  }, [navigate, setUserToken]);

  const value = {
    navigate,
    axios: axiosInstance,
    apiRequest,
    userToken,
    setUserToken,
    userData,
    setUserData,
    logout,
    toast,
    isValidatingToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within <AppProvider>");
  return ctx;
};
