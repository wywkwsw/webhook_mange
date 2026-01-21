import { validateEnv } from "./env.validation";

describe("validateEnv", () => {
  it("allows minimal config outside production", () => {
    expect(() => validateEnv({})).not.toThrow();
    expect(() => validateEnv({ NODE_ENV: "test" })).not.toThrow();
  });

  it("requires JWT_SECRET in production", () => {
    expect(() =>
      validateEnv({ NODE_ENV: "production", CORS_ORIGIN: "https://app.example.com" }),
    ).toThrow(/JWT_SECRET is required/);
  });

  it("rejects default JWT_SECRET in production", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        JWT_SECRET: "dev_secret",
        CORS_ORIGIN: "https://app.example.com",
      }),
    ).toThrow(/JWT_SECRET must not be the default value/);
  });

  it("requires CORS_ORIGIN in production", () => {
    expect(() => validateEnv({ NODE_ENV: "production", JWT_SECRET: "s" })).toThrow(
      /CORS_ORIGIN is required in production/,
    );
  });

  it("rejects wildcard CORS_ORIGIN in production", () => {
    expect(() =>
      validateEnv({ NODE_ENV: "production", JWT_SECRET: "s", CORS_ORIGIN: "*" }),
    ).toThrow(/CORS_ORIGIN must not include/);
  });

  it("rejects invalid CORS origins in production", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        JWT_SECRET: "s",
        CORS_ORIGIN: "https://app.example.com/with-path",
      }),
    ).toThrow(/must not include path/);
  });
});
