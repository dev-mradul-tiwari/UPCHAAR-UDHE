export interface SendSmsParams {
  phone: string;
  message: string;
  receiveSms?: boolean;
}

export class SmsService {
  /**
   * Normalizes Indian phone numbers to 10 digits for SMS gateways.
   */
  private static cleanPhoneNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      return digitsOnly.substring(2);
    }
    if (digitsOnly.length === 10) {
      return digitsOnly;
    }
    return digitsOnly;
  }

  /**
   * Sends an SMS using Jio SIM Android Gateway (Traccar Gateway).
   */
  private static async sendViaJioGateway(phone: string, message: string): Promise<boolean> {
    const gatewayUrl = process.env.JIO_GATEWAY_URL || "http://192.168.29.171:8082";
    const token = process.env.JIO_GATEWAY_TOKEN || "f3b83d8b-f4b7-4cc4-8bba-fadefcab109c";

    const endpoint = gatewayUrl.endsWith("/") ? `${gatewayUrl}send` : `${gatewayUrl}/send`;
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jio SIM Gateway error [${response.status}]: ${errorText}`);
    }

    console.log(`[SMS - Jio SIM Gateway SUCCESS] Sent to ${formattedPhone}`);
    return true;
  }

  /**
   * Console logger fallback for local debugging.
   */
  private static logToConsole(phone: string, message: string): void {
    console.log("\n=================== SMS NOTIFICATION ===================");
    console.log(`TO     : +91 ${phone}`);
    console.log(`MESSAGE: ${message}`);
    console.log("========================================================\n");
  }

  /**
   * Main dispatch method — routes all SMS messages via Jio SIM Gateway.
   */
  public static async sendSms({ phone, message, receiveSms }: SendSmsParams): Promise<void> {
    if (receiveSms === false) {
      console.log(`[SMS OPT-OUT] Patient has SMS disabled. Skipping.`);
      return;
    }

    const cleanPhone = this.cleanPhoneNumber(phone);
    const mode = (process.env.SMS_PROVIDER || "jio").toLowerCase();

    if (mode === "console") {
      this.logToConsole(cleanPhone, message);
      return;
    }

    try {
      await this.sendViaJioGateway(cleanPhone, message);
    } catch (err: any) {
      console.warn(`[SMS WARNING] Jio SIM Gateway error: ${err.message}. Falling back to Console Log.`);
      this.logToConsole(cleanPhone, message);
    }
  }

  /**
   * Formats date and slot time into readable string (e.g., "Sun, Aug 23, 2026 at 5:00 PM").
   */
  private static formatDateTime(scheduledFor?: Date | string): string {
    if (!scheduledFor) return "";
    const d = new Date(scheduledFor);
    if (isNaN(d.getTime())) return "";
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  }

  /* -------------------------------------------------- Trigger Helpers */

  public static async sendBookingCreatedSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    queueNumber: number;
    scheduledFor?: Date | string;
    receiveSms?: boolean;
  }): Promise<void> {
    const slotInfo = this.formatDateTime(appt.scheduledFor);
    const timePart = slotInfo ? ` for ${slotInfo}` : "";
    const message = `Hi ${appt.patientName}, your appointment request at ${appt.hospitalName} (${appt.departmentName})${timePart} has been received. Token #${appt.queueNumber}. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }

  public static async sendAppointmentConfirmedSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    queueNumber: number;
    scheduledFor?: Date | string;
    peopleAhead?: number;
    receiveSms?: boolean;
  }): Promise<void> {
    const slotInfo = this.formatDateTime(appt.scheduledFor);
    const timePart = slotInfo ? ` for ${slotInfo}` : "";

    let message: string;
    if (appt.peopleAhead === 1) {
      message = `Hi ${appt.patientName}, your appointment at ${appt.hospitalName} (${appt.departmentName})${timePart} is CONFIRMED. Token #${appt.queueNumber}. Only 1 patient is ahead of you, so we hope you will come on time. - Upchaar`;
    } else {
      message = `Hi ${appt.patientName}, your appointment at ${appt.hospitalName} (${appt.departmentName})${timePart} is CONFIRMED. Token #${appt.queueNumber}. - Upchaar`;
    }

    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }

  public static async sendQueueAlertSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    queueNumber: number;
    peopleAhead: number;
    receiveSms?: boolean;
  }): Promise<void> {
    const message = `ALERT: Hi ${appt.patientName}, there is only ${appt.peopleAhead} patient ahead of you at ${appt.hospitalName} (${appt.departmentName})! Please come near the consultation room as soon as possible. Token #${appt.queueNumber}. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }

  public static async sendConsultationCompletedSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    doctorName?: string;
    receiveSms?: boolean;
  }): Promise<void> {
    const rawDoc = appt.doctorName ? appt.doctorName.trim() : "";
    const cleanDoc = rawDoc.replace(/^(dr\.?\s*)+/i, "").trim();
    const docPart = cleanDoc ? ` with Dr. ${cleanDoc}` : "";
    const message = `Hi ${appt.patientName}, your consultation at ${appt.hospitalName}${docPart} is complete. Please rate your experience on the Upchaar portal. Thank you!`;
    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }

  public static async sendAppointmentCompletedSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    doctorName?: string;
    receiveSms?: boolean;
  }): Promise<void> {
    await this.sendConsultationCompletedSms(appt);
  }

  public static async sendAppointmentCancelledSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    receiveSms?: boolean;
  }): Promise<void> {
    const message = `Hi ${appt.patientName}, your appointment at ${appt.hospitalName} (${appt.departmentName}) has been CANCELLED. If you did not request this, please contact support. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }

  public static async sendAppointmentInProgressSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    doctorName?: string;
    receiveSms?: boolean;
  }): Promise<void> {
    const rawDoc = appt.doctorName ? appt.doctorName.trim() : "";
    const cleanDoc = rawDoc.replace(/^(dr\.?\s*)+/i, "").trim();
    const docPart = cleanDoc ? ` with Dr. ${cleanDoc}` : "";
    const message = `Hi ${appt.patientName}, your turn has arrived at ${appt.hospitalName} (${appt.departmentName})${docPart}. Please enter the consultation room now. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message, receiveSms: appt.receiveSms });
  }
}
