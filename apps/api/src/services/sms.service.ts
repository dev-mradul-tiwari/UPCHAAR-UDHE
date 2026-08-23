export interface SendSmsParams {
  phone: string;
  message: string;
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
   * Sends an SMS using Jio SIM Android Gateway (Traccar Gateway - Primary Provider).
   */
  private static async sendViaJioGateway(phone: string, message: string): Promise<boolean> {
    const gatewayUrl = process.env.JIO_GATEWAY_URL;
    const token = process.env.JIO_GATEWAY_TOKEN;

    if (!gatewayUrl) {
      throw new Error("JIO_GATEWAY_URL is not configured.");
    }

    const endpoint = gatewayUrl.endsWith("/") ? `${gatewayUrl}send` : `${gatewayUrl}/send`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jio SIM Gateway error [${response.status}]: ${errorText}`);
    }

    console.log(`[SMS - Jio SIM Primary SUCCESS] Sent to +91${phone}`);
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
   * Main dispatch method using Jio SIM Android Gateway as Primary Provider.
   */
  public static async sendSms({ phone, message }: SendSmsParams): Promise<void> {
    const cleanPhone = this.cleanPhoneNumber(phone);
    const mode = (process.env.SMS_PROVIDER || "jio").toLowerCase();

    if (mode === "console") {
      this.logToConsole(cleanPhone, message);
      return;
    }

    try {
      await this.sendViaJioGateway(cleanPhone, message);
    } catch (err: any) {
      console.warn(`[SMS FAILOVER] Jio SIM Gateway failed: ${err.message}. Falling back to Console Log.`);
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
    if (appt.receiveSms === false || !appt.patientPhone) return;
    const dateText = this.formatDateTime(appt.scheduledFor);
    const dateInfo = dateText ? ` for ${dateText}` : "";
    const msg = `Hi ${appt.patientName}, your appointment request at ${appt.hospitalName} (${appt.departmentName})${dateInfo} is received. Token #${appt.queueNumber}. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message: msg });
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
    if (appt.receiveSms === false || !appt.patientPhone) return;
    const dateText = this.formatDateTime(appt.scheduledFor);
    const dateInfo = dateText ? ` for ${dateText}` : "";
    let msg: string;
    if (appt.peopleAhead === 1) {
      msg = `Hi ${appt.patientName}, your appointment at ${appt.hospitalName} (${appt.departmentName})${dateInfo} is CONFIRMED. Token #${appt.queueNumber}. Only 1 patient is ahead of you, so we hope you will come on time. - Upchaar`;
    } else {
      msg = `Hi ${appt.patientName}, your appointment at ${appt.hospitalName} (${appt.departmentName})${dateInfo} is CONFIRMED. Token #${appt.queueNumber}. Please arrive on time. - Upchaar`;
    }
    await this.sendSms({ phone: appt.patientPhone, message: msg });
  }

  public static async sendQueueAlertSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    departmentName: string;
    queueNumber: number;
    receiveSms?: boolean;
  }): Promise<void> {
    if (appt.receiveSms === false || !appt.patientPhone) return;
    const msg = `ALERT: Hi ${appt.patientName}, there is only 1 patient ahead of you at ${appt.hospitalName} (${appt.departmentName})! Please come near the consultation room as soon as possible. Token #${appt.queueNumber}. - Upchaar`;
    await this.sendSms({ phone: appt.patientPhone, message: msg });
  }

  public static async sendAppointmentCompletedSms(appt: {
    patientName: string;
    patientPhone: string;
    hospitalName: string;
    doctorName?: string;
    receiveSms?: boolean;
  }): Promise<void> {
    if (appt.receiveSms === false || !appt.patientPhone) return;
    const cleanDoc = appt.doctorName ? appt.doctorName.replace(/^(Dr\.\s*|Dr\s*)+/i, "") : "";
    const docText = cleanDoc ? ` with Dr. ${cleanDoc}` : "";
    const msg = `Hi ${appt.patientName}, your consultation at ${appt.hospitalName}${docText} is complete. Please rate your experience on the Upchaar portal. Thank you!`;
    await this.sendSms({ phone: appt.patientPhone, message: msg });
  }
}
