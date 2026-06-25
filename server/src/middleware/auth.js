/**
 * Server auth middleware for SkillBridge.
 * Resolves the signed-in Supabase user from the Authorization header
 * and exposes it as `request.user`.
 */

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.slice("Bearer ".length).trim() || null;
}

export function requireAuth({ supabaseUrl, supabaseKey, fetchImpl = fetch }) {
  return async (request, response, next) => {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return response.status(401).json({
        error: "Missing or invalid Authorization header",
      });
    }

    try {
      const userResponse = await fetchImpl(
        `${supabaseUrl}/auth/v1/user`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!userResponse.ok) {
        return response.status(401).json({
          error: "Invalid or expired access token",
        });
      }

      const user = await userResponse.json();
      const role = await resolveTrustedRole({
        supabaseUrl,
        supabaseKey,
        fetchImpl,
        userId: user.id,
      });

      request.user = {
        id: user.id,
        email: user.email,
        role,
      };

      next();
    } catch (error) {
      return response.status(502).json({
        error: "Failed to verify access token",
      });
    }
  };
}

/**
 * Resolves the user's role from the service-role-protected `user_roles` table,
 * never from user_metadata (which the user can edit). Fails to the
 * least-privilege "student" if the role cannot be read, so a lookup problem can
 * never escalate access.
 */
async function resolveTrustedRole({ supabaseUrl, supabaseKey, fetchImpl, userId }) {
  try {
    const rolesUrl = new URL("/rest/v1/user_roles", supabaseUrl);
    rolesUrl.searchParams.set("user_id", `eq.${userId}`);
    rolesUrl.searchParams.set("select", "role");

    const res = await fetchImpl(rolesUrl.toString(), {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });

    if (!res.ok) {
      return "student";
    }

    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row?.role === "employer" ? "employer" : "student";
  } catch {
    return "student";
  }
}

export function requireRole(role) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    if (request.user.role !== role) {
      return response.status(403).json({
        error: `This endpoint requires the '${role}' role`,
      });
    }

    next();
  };
}
