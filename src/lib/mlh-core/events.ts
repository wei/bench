/**
 * MLH Core API event payload (v4). Timestamps are Unix epoch seconds.
 */
export type MlhEventApi = {
  background_url?: string | null;
  created_at?: number;
  ends_at?: number | null;
  event_format?: string | null;
  id?: string;
  logo_url?: string | null;
  name: string;
  program?: string | null;
  registration_url?: string | null;
  slug: string;
  starts_at?: number | null;
  status: string;
  type?: string | null;
  updated_at?: number;
  website_url?: string | null;

  // Keep these as escape hatches for fields MLH may include
  // (and because the query uses event_type[eq]=...)
  event_type?: string | null;
  [key: string]: unknown;
};

export class MlhApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly responseText?: string;

  constructor(args: {
    message: string;
    status: number;
    statusText: string;
    url: string;
    responseText?: string;
  }) {
    super(args.message);
    this.name = "MlhApiError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.responseText = args.responseText;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function buildUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string>,
) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const url = new URL(`${normalizedBase}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Fetch MLH Core events with the exact filters requested.
 *
 * GET {{MLH_API_URL}}/v4/events?
 *   limit=50
 *   starts_at[gte]=2025-12-16
 *   ends_at[lte]=2026-01-16
 *   event_format[eq]=hackathon
 *   event_type[eq]=physical
 *
 * Auth:
 *   Authorization: Bearer {{MLH_CORE_PROD_API}}
 */
export async function fetchMlhEvents(args?: {
  limit?: number;
  startsAtGte?: string;
  endsAtLte?: string;
  eventFormatEq?: string;
  eventTypeEq?: string;
  signal?: AbortSignal;
}): Promise<MlhEventApi[]> {
  const baseUrl = requireEnv("MLH_API_URL");
  const token = requireEnv("MLH_CORE_PROD_API");

  const startsAtDefault = formatDateYYYYMMDD(new Date());
  const endsAtDefaultDate = new Date();
  endsAtDefaultDate.setDate(endsAtDefaultDate.getDate() + 30);
  const endsAtDefault = formatDateYYYYMMDD(endsAtDefaultDate);

  const url = buildUrl(baseUrl, "/v4/events", {
    limit: String(args?.limit ?? 50),
    "starts_at[gte]": args?.startsAtGte ?? startsAtDefault,
    "ends_at[lte]": args?.endsAtLte ?? endsAtDefault,
    "event_format[eq]": args?.eventFormatEq ?? "hackathon",
    "event_type[eq]": args?.eventTypeEq ?? "physical",
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: args?.signal,
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => undefined);
    throw new MlhApiError({
      message: `MLH API error: ${response.status} ${response.statusText}`,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
      responseText,
    });
  }

  return (await response.json()) as MlhEventApi[];
}
