import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
	
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_visits`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.statusText}`);
    }

    const newCount = await response.json();
    return new Response(
      JSON.stringify({ visits: newCount }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
