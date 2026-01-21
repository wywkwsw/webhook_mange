type RawEnv = Record<string, unknown>;

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseCommaList(value: unknown): string[] {
  const raw = asNonEmptyString(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeDbType(raw: unknown): string {
  return (asNonEmptyString(raw) ?? "postgres").toLowerCase();
}

function parseIntOrUndefined(value: unknown): number | undefined {
  const s = asNonEmptyString(value);
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

function assertIntRange(
  key: string,
  value: unknown,
  range: { min: number; max: number },
  errors: string[],
) {
  const n = parseIntOrUndefined(value);
  if (n === undefined) return;
  if (n < range.min || n > range.max) {
    errors.push(`${key} must be an integer in range [${range.min}, ${range.max}]`);
  }
}

function assertNonEmpty(key: string, value: unknown, errors: string[]) {
  if (!asNonEmptyString(value)) {
    errors.push(`${key} is required`);
  }
}

function assertCorsOriginList(raw: unknown, errors: string[]) {
  const origins = parseCommaList(raw);
  if (!origins.length) {
    errors.push("CORS_ORIGIN must contain at least one origin");
    return;
  }

  if (origins.includes("*")) {
    errors.push("CORS_ORIGIN must not include '*' in production");
  }

  for (const origin of origins) {
    if (origin === "*") continue;
    try {
      const url = new URL(origin);
      if (url.origin !== origin) {
        errors.push(`CORS_ORIGIN must not include path/query (${origin})`);
      }
    } catch {
      errors.push(`CORS_ORIGIN is invalid (${origin})`);
    }
  }
}

export function validateEnv(env: RawEnv): RawEnv {
  const errors: string[] = [];

  const nodeEnv = asNonEmptyString(env.NODE_ENV) ?? "development";
  const isProd = nodeEnv === "production";

  const dbType = normalizeDbType(env.DB_TYPE);
  env.DB_TYPE = dbType;

  assertIntRange("PORT", env.PORT, { min: 1, max: 65535 }, errors);

  assertIntRange("DB_PORT", env.DB_PORT, { min: 1, max: 65535 }, errors);
  assertIntRange("DB_POOL_MAX", env.DB_POOL_MAX, { min: 1, max: 1000 }, errors);
  assertIntRange(
    "DB_POOL_IDLE_TIMEOUT_MS",
    env.DB_POOL_IDLE_TIMEOUT_MS,
    { min: 1, max: 600_000 },
    errors,
  );
  assertIntRange(
    "DB_POOL_CONN_TIMEOUT_MS",
    env.DB_POOL_CONN_TIMEOUT_MS,
    { min: 1, max: 600_000 },
    errors,
  );

  assertIntRange("BCRYPT_SALT_ROUNDS", env.BCRYPT_SALT_ROUNDS, { min: 1, max: 31 }, errors);

  if (isProd) {
    assertNonEmpty("JWT_SECRET", env.JWT_SECRET, errors);
    if (asNonEmptyString(env.JWT_SECRET) === "dev_secret") {
      errors.push("JWT_SECRET must not be the default value (dev_secret) in production");
    }

    if (asNonEmptyString(env.DB_SYNCHRONIZE) === "true") {
      errors.push("DB_SYNCHRONIZE must be false in production");
    }

    if (dbType === "postgres") {
      assertNonEmpty("DB_HOST", env.DB_HOST, errors);
      assertNonEmpty("DB_PORT", env.DB_PORT, errors);
      assertNonEmpty("DB_USERNAME", env.DB_USERNAME, errors);
      assertNonEmpty("DB_PASSWORD", env.DB_PASSWORD, errors);
      assertNonEmpty("DB_DATABASE", env.DB_DATABASE, errors);
    }

    const corsOriginRaw = asNonEmptyString(env.CORS_ORIGIN) ?? asNonEmptyString(env.CORS_ORIGINS);
    if (!corsOriginRaw) {
      errors.push("CORS_ORIGIN is required in production");
    } else {
      assertCorsOriginList(corsOriginRaw, errors);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\\n- ${errors.join("\\n- ")}`);
  }

  return env;
}
