import { Router } from "express";

export const profileRouter = Router();

profileRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/employer_profiles", url);
    fetchUrl.searchParams.set("user_id", `eq.${userId}`);
    fetchUrl.searchParams.set("select", "*");

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      console.error("Supabase GET profile error body:", errorBody);
      throw new Error(`Supabase error: ${supabaseResponse.status} ${errorBody}`);
    }

    const data = await supabaseResponse.json();
    const profile = data.length > 0 ? data[0] : null;

    response.json({ ok: true, profile });
  } catch (error) {
    console.error("Failed to fetch employer profile:", error);
    response.status(500).json({ error: "Failed to fetch profile" });
  }
});

profileRouter.put("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const userId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/employer_profiles", url);
    fetchUrl.searchParams.set("on_conflict", "user_id");

    const payload = {
      ...request.body,
      user_id: userId,
    };

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      throw new Error(`Supabase error: ${supabaseResponse.status} ${errorBody}`);
    }

    const data = await supabaseResponse.json();
    const profile = Array.isArray(data) ? data[0] : data;

    response.json({ ok: true, profile });
  } catch (error) {
    console.error("Failed to update employer profile:", error);
    response.status(500).json({ error: "Failed to update profile" });
  }
});
