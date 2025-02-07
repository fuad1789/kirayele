import axios from "axios";

// Set the base URL based on environment
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Add default headers
axios.defaults.headers.common["Content-Type"] = "application/json";

export default axios;
