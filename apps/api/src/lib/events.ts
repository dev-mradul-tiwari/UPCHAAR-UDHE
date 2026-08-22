import { EventEmitter } from "node:events";

/**
 * In-process pub/sub used by the SSE routes. Deliberately tiny: publishers
 * announce *that* an appointment changed, subscribers re-read the current
 * state so every client always receives a fresh, contract-shaped payload.
 */
export type AppointmentChanged = {
  appointmentId: string;
  hospitalId: string;
  departmentId: string;
  patientId: string;
  /** UTC calendar day the appointment is queued in, ISO-8601. */
  scheduledDay: string;
  reason: "created" | "status" | "assigned" | "cancelled";
};

type Listener = (event: AppointmentChanged) => void;

const departmentChannel = (departmentId: string): string => `department:${departmentId}`;
const appointmentChannel = (appointmentId: string): string => `appointment:${appointmentId}`;

class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // SSE fan-out can exceed the default 10 listeners per channel.
    this.emitter.setMaxListeners(0);
  }

  publishAppointmentChanged(event: AppointmentChanged): void {
    this.emitter.emit(departmentChannel(event.departmentId), event);
    this.emitter.emit(appointmentChannel(event.appointmentId), event);
  }

  /** Returns an unsubscribe function — call it on client disconnect. */
  onDepartment(departmentId: string, listener: Listener): () => void {
    const channel = departmentChannel(departmentId);
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  onAppointment(appointmentId: string, listener: Listener): () => void {
    const channel = appointmentChannel(appointmentId);
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }
}

export const bus = new EventBus();
