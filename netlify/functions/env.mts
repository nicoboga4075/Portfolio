import { Context } from "@netlify/functions";
import { internalError, isTrustedRequest, jsonResponse, redirectTo404 } from "./shared/http.mjs";

const PUBLIC_ENV_VARS = [
    "ENV_CLIENT_ID",
    "SITE_RECAPTCHA_KEY"
];

// Google's public reCAPTCHA v2 test key (always passes, no domain allowlist): https://developers.google.com/recaptcha/docs/faq
const RECAPTCHA_TEST_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

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

    return jsonResponse(transform(await response.json()));
}

type GithubCommit = {
    commit: {
        committer: {
            date: string
        }
    }
};

// CVs are only published for these languages; any other request falls back to the first.
const CV_LANGS = new Set(["en", "fr"]);

function getLastCvUpdate(lang: string): Promise<Response> {
    const cvLang = CV_LANGS.has(lang) ? lang : [...CV_LANGS][0];
    return webhook<GithubCommit[]>(
        `https://api.github.com/repos/nicoboga4075/Portfolio/commits?path=docs/public/CV_${cvLang}.pdf&per_page=1`,
        data => ({
            date: data[0]?.commit.committer.date
        })
    );
}

export default async function handlerEnv(req: Request, context: Context): Promise<Response> {
    try {
        const url = new URL(req.url);
        const lang = url.searchParams.get("lang");

        if (!isTrustedRequest(req)) {
            return redirectTo404();
        }

        if (lang) {
            const isValidLang = /^[a-z]{2}$/.test(lang);
            if (!isValidLang) {
                return redirectTo404();
            }
            return await getLastCvUpdate(lang);
        }

        const filteredEnvVars: Record<string, string | undefined> = Object.fromEntries(
            PUBLIC_ENV_VARS
                .filter(key => key in process.env)
                .map(key => [key, process.env[key]])
        );

        // Under `netlify dev` the real key's domain allowlist excludes localhost, so the widget can't render; hand back Google's test key instead so the contact form's captcha is usable locally.
        if (process.env.CONTEXT === "dev") {
            filteredEnvVars.SITE_RECAPTCHA_KEY = RECAPTCHA_TEST_KEY;
        }

        return jsonResponse(filteredEnvVars);
    } catch (error) {
        return internalError(context, error);
    }
};
