import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const apiKey = Netlify.env.get("CLIENT_ID");
  return new Response(apiKey);
};