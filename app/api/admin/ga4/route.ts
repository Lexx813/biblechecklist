/**
 * GA4 Data API proxy — admin only.
 *   GET /api/admin/ga4?report=topPages|topEvents
 *
 * Setup (required to enable):
 *   1. In Google Cloud, create a service account with the
 *      "Analytics Data API" role (or grant Viewer on the GA4 property
 *      to the service-account email under Admin → Property → Property
 *      Access Management).
 *   2. Download the service account's JSON key.
 *   3. Set env vars on Vercel:
 *        GA4_PROPERTY_ID            = your numeric GA4 property ID (no "G-" prefix)
 *        GA4_SERVICE_ACCOUNT_JSON   = paste the entire JSON key as a string
 *
 * Until both are set this endpoint returns 503 with setup instructions
 * so the admin tab can render a "configure GA4" hint instead of failing.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

import { createSign } from "node:crypto";
import { authorizeAdmin, jsonResponse } from "../songs/_authorize";

const GA4_PROPERTY_ID = (process.env.GA4_PROPERTY_ID ?? "").trim();
const GA4_SERVICE_ACCOUNT_JSON = (process.env.GA4_SERVICE_ACCOUNT_JSON ?? "").trim();

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let cachedToken: { token: string; exp: number } | null = null;

function b64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = b64url(signer.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 token exchange failed: ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    exp: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

interface RunReportRow {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface RunReportResponse {
  rows?: RunReportRow[];
}

async function runReport(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<RunReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed: ${text}`);
  }
  return (await res.json()) as RunReportResponse;
}

const REPORT_BODIES: Record<string, Record<string, unknown>> = {
  topPages: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 50,
  },
  topEvents: {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 30,
  },
};

export async function GET(req: Request) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  if (!GA4_PROPERTY_ID || !GA4_SERVICE_ACCOUNT_JSON) {
    return jsonResponse(
      {
        error: "GA4 not configured",
        setup: {
          missing: [
            !GA4_PROPERTY_ID && "GA4_PROPERTY_ID",
            !GA4_SERVICE_ACCOUNT_JSON && "GA4_SERVICE_ACCOUNT_JSON",
          ].filter(Boolean),
          steps: [
            "Create a GCP service account with read access to your GA4 property",
            "Download its JSON key",
            "Set GA4_PROPERTY_ID (numeric) and GA4_SERVICE_ACCOUNT_JSON (the JSON contents) on Vercel",
          ],
        },
      },
      503,
    );
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(GA4_SERVICE_ACCOUNT_JSON) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) throw new Error("missing client_email or private_key");
  } catch (e) {
    return jsonResponse({ error: `Invalid GA4_SERVICE_ACCOUNT_JSON: ${(e as Error).message}` }, 500);
  }

  const url = new URL(req.url);
  const reportName = url.searchParams.get("report") ?? "topPages";
  const body = REPORT_BODIES[reportName];
  if (!body) {
    return jsonResponse({ error: `Unknown report: ${reportName}` }, 400);
  }

  try {
    const token = await getAccessToken(sa);
    const result = await runReport(token, body);

    const rows = (result.rows ?? []).map(r => ({
      dimensions: r.dimensionValues.map(d => d.value),
      metrics: r.metricValues.map(m => Number(m.value) || 0),
    }));

    return jsonResponse({ report: reportName, rows });
  } catch (e) {
    console.error("[ga4]", reportName, (e as Error).message);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
}
