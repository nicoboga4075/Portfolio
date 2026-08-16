import { Context } from "@netlify/functions";

const PUBLIC_ENV_VARS = [
    "ENV_CLIENT_ID",
    "SITE_RECAPTCHA_KEY"
];

async function webhook<T>(url: string, transform: (data: T) => unknown): Promise<Response> {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}`,
            Accept: "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(`Webhook fetch failed: ${response.statusText}`);
    }

    return new Response(JSON.stringify(transform(await response.json())), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}

type GithubCommit = {
    commit: {
        committer: {
            date: string
        }
    }
};

function getLastCvUpdate(lang: string): Promise<Response> {
    return webhook<GithubCommit[]>(
        `https://api.github.com/repos/nicoboga4075/Portfolio/commits?path=docs/public/CV_${lang}.pdf&per_page=1`,
        data => ({
            date: data[0]?.commit.committer.date
        })
    );
}

export default async function handlerEnv(req: Request, context: Context): Promise<Response> {
    try {
        const url = new URL(req.url);
        const lang = url.searchParams.get("lang");

        const referer = req.headers.get("referer") || "";
        const userAgent = req.headers.get("user-agent") || "";

        const error404 = new URL("/404", req.url).toString();

        const allowedReferers = [
            "http://localhost:8888",
            "https://nicoboga.netlify.app"
        ];

        const isFromSite = allowedReferers.some(origin => referer.startsWith(origin)) ||
            /^https:\/\/[^/]+\.netlify\.live\//.test(referer);
        const isFromLighthouse = /Lighthouse|Chrome-Lighthouse/i.test(userAgent);

        if (!isFromSite && !isFromLighthouse) {
            return Response.redirect(error404, 302);
        }

        if (lang) {
            const isValidLang = /^(fr|en)$/.test(lang);
            if (!isValidLang) {
                return Response.redirect(error404, 302);
            }
            return await getLastCvUpdate(lang);
        }

        const filteredEnvVars = Object.fromEntries(
            PUBLIC_ENV_VARS
                .filter(key => key in process.env)
                .map(key => [key, process.env[key]])
        );

        return new Response(JSON.stringify(filteredEnvVars), {
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error(`[${context.requestId}]`, error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
};
