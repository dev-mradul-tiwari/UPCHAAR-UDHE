/** Shared session constants — safe to import from middleware, server and client. */

export const SESSION_COOKIE = "upchaar_patient_token";

/** 7 days, matching the API's JWT TTL. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const HOME_PATH = "/dashboard";
