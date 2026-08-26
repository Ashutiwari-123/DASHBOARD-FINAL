import {NextResponse} from "next/server";import {createOAuthState,STATE_COOKIE} from "@/lib/github-session";import {requireGitHubConfig} from "@/lib/env";
export const runtime="nodejs";
export function GET(){const {GITHUB_APP_SLUG}=requireGitHubConfig(),state=createOAuthState(),response=NextResponse.redirect(`https://github.com/apps/${GITHUB_APP_SLUG}/installations/new?state=${state}`);response.cookies.set(STATE_COOKIE,state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:600,path:"/"});return response;}
