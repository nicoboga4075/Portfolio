import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const filteredEnvVars = Object.entries(process.env)
    .filter(([key, _]) => key.startsWith("ENV_") || key.startsWith("SITE_") || key.startsWith("GITHUB_"))
    .reduce((acc, [key, value]) => {
      acc[key] = key.includes("SECRET") ? "HIDDEN" : value;
      return acc;
    }, {} as Record<string, string>);

  return new Response(JSON.stringify(filteredEnvVars), {
    headers: { "Content-Type": "application/json" },
  });
};
