const defaultClientOrigin = "http://127.0.0.1:5173";
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function buildCorsOptions() {
  const configuredOrigins = readConfiguredOrigins();

  return {
    origin(origin, callback) {
      if (!origin || configuredOrigins.has(origin) || isLocalDevOrigin(origin)) {
        callback(null, origin || defaultClientOrigin);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  };
}

function readConfiguredOrigins() {
  const origins = [
    process.env.CLIENT_ORIGIN,
    ...(process.env.CLIENT_ORIGINS || "").split(","),
  ]
    .map((origin) => String(origin || "").trim())
    .filter(Boolean);

  return new Set(origins.length > 0 ? origins : [defaultClientOrigin]);
}

function isLocalDevOrigin(origin) {
  return localDevOriginPattern.test(origin);
}
