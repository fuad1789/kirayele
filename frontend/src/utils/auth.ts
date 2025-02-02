import { v4 as uuidv4 } from "uuid";

// Get or generate a unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

// Get device information
export const getDeviceInfo = () => {
  const deviceId = getDeviceId();
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;

  return {
    deviceId,
    deviceName: `${platform} - ${userAgent}`,
  };
};

// Initialize reCAPTCHA
export const initRecaptcha = () => {
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${
      import.meta.env.VITE_RECAPTCHA_SITE_KEY
    }`;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

// Get reCAPTCHA token
export const getReCaptchaToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }

    (window as any).grecaptcha.ready(() => {
      (window as any).grecaptcha
        .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: "submit" })
        .then((token: string) => resolve(token))
        .catch((error: Error) => reject(error));
    });
  });
};

// Check session expiration
export const checkSessionExpiration = (): boolean => {
  const lastActivity = localStorage.getItem("last_activity");
  if (!lastActivity) return true;

  const now = new Date().getTime();
  const lastActivityTime = parseInt(lastActivity, 10);
  const thirtyMinutes = 30 * 60 * 1000;

  return now - lastActivityTime > thirtyMinutes;
};

// Update last activity timestamp
export const updateLastActivity = (): void => {
  localStorage.setItem("last_activity", new Date().getTime().toString());
};

// Clear auth data
export const clearAuthData = (): void => {
  localStorage.removeItem("last_activity");
};
