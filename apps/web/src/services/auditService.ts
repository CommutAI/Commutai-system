import { supabase } from '@commutai/supabase';

class AuditService {
  static async logAction(action: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action,
          details,
        } as any);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  static async logPageView(page: string) {
    return this.logAction('page_view', { page });
  }

  static async logUserAction(action: string, details?: any) {
    return this.logAction(action, details);
  }

  static async logAuditEvent({ action, module, details }: { action: string; module: string; details?: string }) {
    return this.logAction(action, { module, details });
  }

  static async logEmergencyAlertResolved(alertId: string, notes: string) {
    return this.logAction('emergency_alert_resolved', { alertId, notes });
  }

  static async logTripEnded(tripId: string, busInfo: string) {
    return this.logAction('trip_ended', { tripId, busInfo });
  }

  static async logTripCancelled(tripId: string, busInfo: string) {
    return this.logAction('trip_cancelled', { tripId, busInfo });
  }

  static async logTripUpdated(tripId: string, details: string) {
    return this.logAction('trip_updated', { tripId, details });
  }

  static async logFareMatrixUpdated(routeFrom: string, routeTo: string, details: string) {
    return this.logAction('fare_matrix_updated', { routeFrom, routeTo, details });
  }

  static async logTripDeleted(tripId: string, busInfo: string) {
    return this.logAction('trip_deleted', { tripId, busInfo });
  }

  static async logBusCreated(busNumber: string, plateNumber: string) {
    return this.logAction('bus_created', { busNumber, plateNumber });
  }

  static async logBusUpdated(busId: string, details: string) {
    return this.logAction('bus_updated', { busId, details });
  }

  static async logBusStatusChanged(busId: string, oldStatus: string, newStatus: string) {
    return this.logAction('bus_status_changed', { busId, oldStatus, newStatus });
  }

  static async logBusDeleted(busId: string, plateNumber: string) {
    return this.logAction('bus_deleted', { busId, plateNumber });
  }

  static async logDataExported(reportType: string, recordCount: number) {
    return this.logAction('data_exported', { reportType, recordCount });
  }

  static async logIrregularityResolved(irregularityId: string, details: string) {
    return this.logAction('irregularity_resolved', { irregularityId, details });
  }

  static async logAnalyticsViewed(reportType: string) {
    return this.logAction('analytics_viewed', { reportType });
  }

  static async logUserStatusChanged(userId: string, oldStatus: string, newStatus: string) {
    return this.logAction('user_status_changed', { userId, oldStatus, newStatus });
  }

  static async logLogout() {
    return this.logAction('logout', {});
  }

  static async logLogin(userId: string) {
    return this.logAction('login', { userId });
  }

  static async logUserCreated(userId: string, email: string) {
    return this.logAction('user_created', { userId, email });
  }
}

export default AuditService;
