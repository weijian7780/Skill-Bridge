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
      request.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? "student",
      };

      next();
    } catch (error) {
      return response.status(502).json({
        error: "Failed to verify access token",
      });
    }
  };
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
