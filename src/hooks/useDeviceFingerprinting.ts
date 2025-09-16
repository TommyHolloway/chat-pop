import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeviceInfo {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  fingerprint: string;
  trusted: boolean;
  lastSeen: string;
  ipAddress?: string;
}

interface SuspiciousActivity {
  type: 'new_device' | 'location_change' | 'unusual_hours' | 'multiple_devices';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
}

export const useDeviceFingerprinting = () => {
  const { user } = useAuth();
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<DeviceInfo[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate device fingerprint
  const generateFingerprint = useCallback((): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprinting', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: 'ontouchstart' in window,
      canvasFingerprint: canvas.toDataURL(),
      webglVendor: getWebGLVendor(),
      cpuCores: navigator.hardwareConcurrency || 'unknown',
      memoryLimit: (navigator as any).deviceMemory || 'unknown',
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };

    // Create hash from fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    return btoa(fingerprintString).slice(0, 32);
  }, []);

  const getWebGLVendor = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return 'unknown';
  };

  // Initialize device tracking
  const initializeDeviceTracking = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const fingerprint = generateFingerprint();
      const deviceInfo: Partial<DeviceInfo> = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        fingerprint,
        lastSeen: new Date().toISOString()
      };

      // For demo purposes, simulate device registration using activity logs
      try {
        // Log device fingerprint
        await supabase.rpc('log_security_event', {
          event_type: 'device_fingerprint_check',
          user_id_param: user.id,
          details_param: {
            fingerprint,
            ...deviceInfo,
            device_detection: 'fingerprint_based'
          }
        });

        // Create mock device info for current session
        const mockDevice: DeviceInfo = {
          id: fingerprint,
          ...deviceInfo as Required<Pick<DeviceInfo, 'userAgent' | 'screenResolution' | 'timezone' | 'language' | 'platform' | 'fingerprint' | 'lastSeen'>>,
          trusted: true, // For demo, trust current device
        };
        
        setCurrentDevice(mockDevice);
        
        // Alert about new device
        await reportSuspiciousActivity({
          type: 'new_device',
          severity: 'medium',
          details: {
            deviceInfo,
            message: 'New device detected for your account'
          },
          timestamp: new Date().toISOString()
        });

        toast.warning('New Device Detected', {
          description: 'A new device has been registered to your account. Please verify this was you.',
          duration: 10000
        });
      } catch (deviceError) {
        console.error('Failed to register device:', deviceError);
      }

      // Load all trusted devices
      await loadTrustedDevices();
      
    } catch (error) {
      console.error('Device tracking initialization failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user, generateFingerprint]);

  // Load trusted devices from activity logs
  const loadTrustedDevices = useCallback(async () => {
    if (!user) return;

    try {
      // For demo purposes, create mock trusted devices
      const mockDevices: DeviceInfo[] = [
        {
          id: '1',
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          fingerprint: generateFingerprint(),
          trusted: true,
          lastSeen: new Date().toISOString()
        }
      ];
      
      setTrustedDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load trusted devices:', error);
    }
  }, [user, generateFingerprint]);

  // Trust current device
  const trustCurrentDevice = useCallback(async () => {
    if (!currentDevice || !user) return;

    try {
      // Log device trust event
      await supabase.rpc('log_security_event', {
        event_type: 'device_trusted',
        user_id_param: user.id,
        details_param: {
          device_id: currentDevice.id,
          device_fingerprint: currentDevice.fingerprint,
          action: 'trust_device'
        }
      });

      setCurrentDevice(prev => prev ? { ...prev, trusted: true } : null);
      await loadTrustedDevices();
      
      toast.success('Device has been marked as trusted');
    } catch (error) {
      console.error('Failed to trust device:', error);
      toast.error('Failed to trust device');
    }
  }, [currentDevice, user, loadTrustedDevices]);

  // Remove trusted device
  const removeTrustedDevice = useCallback(async (deviceId: string) => {
    if (!user) return;

    try {
      // Log device removal event
      await supabase.rpc('log_security_event', {
        event_type: 'device_untrusted',
        user_id_param: user.id,
        details_param: {
          device_id: deviceId,
          action: 'remove_trusted_device'
        }
      });

      setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
      toast.success('Device removed from trusted devices');
    } catch (error) {
      console.error('Failed to remove device:', error);
      toast.error('Failed to remove device');
    }
  }, [user]);

  // Report suspicious activity
  const reportSuspiciousActivity = useCallback(async (activity: SuspiciousActivity) => {
    if (!user) return;

    try {
      await supabase.rpc('log_security_event', {
        event_type: `device_${activity.type}`,
        user_id_param: user.id,
        details_param: {
          ...activity.details,
          severity: activity.severity,
          detection_method: 'device_fingerprinting'
        }
      });

      setSuspiciousActivities(prev => [activity, ...prev]);
    } catch (error) {
      console.error('Failed to report suspicious activity:', error);
    }
  }, [user]);

  // Monitor for unusual login patterns
  const checkUnusualActivity = useCallback(async () => {
    if (!user) return;

    try {
      // Check for multiple simultaneous sessions
      const recentLogins = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'user_login')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentLogins.data && recentLogins.data.length > 5) {
        await reportSuspiciousActivity({
          type: 'multiple_devices',
          severity: 'high',
          details: {
            loginCount: recentLogins.data.length,
            timeframe: '24 hours'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check for unusual login hours (outside 6 AM - 11 PM local time)
      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 23) {
        await reportSuspiciousActivity({
          type: 'unusual_hours',
          severity: 'medium',
          details: {
            loginTime: new Date().toISOString(),
            localHour: currentHour
          },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to check unusual activity:', error);
    }
  }, [user, reportSuspiciousActivity]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      initializeDeviceTracking();
      checkUnusualActivity();
    }
  }, [user, initializeDeviceTracking, checkUnusualActivity]);

  return {
    currentDevice,
    trustedDevices,
    suspiciousActivities,
    loading,
    trustCurrentDevice,
    removeTrustedDevice,
    generateFingerprint,
    checkUnusualActivity,
    refreshDevices: loadTrustedDevices
  };
};