import { Context } from "@netlify/functions";
import { internalError, isTrustedRequest, jsonResponse, redirectTo404 } from "./shared/http.mjs";
import { isRateLimited, tooManyRequests } from "./shared/rate-limit.mjs";
import pkg from "../../package.json" with { type: "json" };

const PUBLIC_ENV_VARS = [
    "ENV_CLIENT_ID",
    "SITE_RECAPTCHA_KEY"
];

// Google's public reCAPTCHA v2 test key (always passes, no domain allowlist): https://developers.google.com/recaptcha/docs/faq
const RECAPTCHA_TEST_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

async function webhook<T, R extends object>(url: string, transform: (data: T) => R): Promise<Response> {
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

// A commit of the GitHub API, each key optional since the answer is not checked by its type
type GithubCommit = {
    commit?: {
        committer?: {
            date?: string
        }
    }
};

// The date of the last commit of the CV, undefined when the answer lacks it
function commitDate(data: GithubCommit[]): { date: string | undefined } {
    // Not a list of commits, or no commit of the CV yet
    if (!Array.isArray(data) || data.length === 0) {
        return { date: undefined };
    }
    const date = data[0]?.commit?.committer?.date;
    // A commit without its committer date
    if (typeof date !== "string") {
        return { date: undefined };
    }
    return { date };
}

// The languages a docs/public/CV_<lang>.pdf is published for; anything else serves config.cvDefaultLang.
const { cvLangs, cvDefaultLang } = pkg.config;
// The owner/name of the GitHub repository of package.json, whose commits date the CV
const repository = new URL(pkg.repository.url).pathname.slice(1);

function getLastCvUpdate(lang: string): Promise<Response> {
    const cvLang = cvLangs.includes(lang) ? lang : cvDefaultLang;
    return webhook<GithubCommit[], { date: string | undefined }>(
        `https://api.github.com/repos/${repository}/commits?path=docs/public/CV_${cvLang}.pdf&per_page=1`,
        commitDate
    );
}

export default async function handlerEnv(req: Request, context: Context): Promise<Response> {
    try {
        const url = new URL(req.url);
        const lang = url.searchParams.get("lang");

        if (!isTrustedRequest(req)) {
            return redirectTo404();
        }

        // a few calls per page (the contact scripts, the captcha, the CV date): past 60 a minute, a loop draining the quota of GITHUB_API_TOKEN
        if (await isRateLimited("env", 60, context)) {
            return tooManyRequests();
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
