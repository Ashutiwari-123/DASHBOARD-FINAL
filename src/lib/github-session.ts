import {createHmac,randomBytes,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {requireGitHubConfig} from "@/lib/env";
export const SESSION_COOKIE="devscope_session";export const STATE_COOKIE="devscope_oauth_state";
export type GitHubSession={installationId:number;login:string;expiresAt:number};
const sign=(value:string)=>createHmac("sha256",requireGitHubConfig().SESSION_SECRET).update(value).digest("base64url");
export function encodeSession(session:GitHubSession){const body=Buffer.from(JSON.stringify(session)).toString("base64url");return `${body}.${sign(body)}`;}
export function decodeSession(value?:string){if(!value)return null;const[body,sig]=value.split(".");if(!body||!sig)return null;const expected=sign(body);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const session=JSON.parse(Buffer.from(body,"base64url").toString()) as GitHubSession;return session.expiresAt>Date.now()?session:null;}catch{return null;}}
export async function getGitHubSession(){return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);}
export async function requireGitHubSession(){const session=await getGitHubSession();if(!session)throw new Error("Connect GitHub to continue");return session;}
export const createOAuthState=()=>randomBytes(24).toString("base64url");
