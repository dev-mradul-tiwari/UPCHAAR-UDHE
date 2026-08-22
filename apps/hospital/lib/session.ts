/** Shared session constants — safe to import from middleware, server and client. */

export const SESSION_COOKIE = "upchaar_hospital_token";

/** 7 days, matching the API's JWT TTL. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const HOME_PATH = "/dashboard";
