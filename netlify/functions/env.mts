import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const filteredEnvVars = Object.entries(process.env)
    .filter(([key, _]) => key.startsWith("ENV_") || key.startsWith("SITE_"))
    .reduce((acc, [key, value]) => {
      acc[key] = key.includes("SECRET") || key.includes("TOKEN") ? "HIDDEN" : value;
      return acc;
    }, {} as Record<string, string>);

  return new Response(JSON.stringify(filteredEnvVars), {
    headers: { "Content-Type": "application/json" },
  });
};
