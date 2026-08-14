type ErrorMetadata = {
  name: string;
  status?: number;
};

function getErrorMetadata(error: unknown): ErrorMetadata {
  if (error instanceof Error) {
    const candidate = error as Error & { status?: unknown; statusCode?: unknown };
    const rawStatus = candidate.status ?? candidate.statusCode;
    return {
      name: /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(error.name) ? error.name : "Error",
      ...(typeof rawStatus === "number" && Number.isSafeInteger(rawStatus)
        ? { status: rawStatus }
        : {}),
    };
  }

  return { name: "UnknownError" };
}

/**
 * Emits only stable operational metadata. Never pass error.message, stack,
 * request data, prompt text, generated content, credentials, or identifiers
 * to this helper: those values can contain private resume data.
 */
export function logServerFailure(scope: string, error: unknown): void {
  const safeScope = /^[a-z0-9_.-]{1,80}$/i.test(scope) ? scope : "unknown";
  const metadata = getErrorMetadata(error);

  console.error(
    JSON.stringify({
      event: "server_failure",
      scope: safeScope,
      error: metadata.name,
      ...(metadata.status ? { status: metadata.status } : {}),
    }),
  );
}
