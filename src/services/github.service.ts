import {createSign} from "node:crypto";import {readFileSync} from "node:fs";
import {requireGitHubConfig} from "@/lib/env";import type {GitHubRepository,GitHubWorkflowJob,GitHubWorkflowRun} from "@/types/github";
const API="https://api.github.com";const baseHeaders={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};const b64=(v:object)=>Buffer.from(JSON.stringify(v)).toString("base64url");
function appJwt(){const c=requireGitHubConfig(),now=Math.floor(Date.now()/1000),unsigned=`${b64({alg:"RS256",typ:"JWT"})}.${b64({iat:now-60,exp:now+540,iss:c.GITHUB_APP_ID})}`,signer=createSign("RSA-SHA256");signer.update(unsigned);return `${unsigned}.${signer.sign(readFileSync(c.GITHUB_APP_PRIVATE_KEY_PATH,"utf8"),"base64url")}`;}
async function json<T>(r:Response):Promise<T>{if(!r.ok)throw new Error(`GitHub request failed (${r.status})`);return r.json() as Promise<T>;}
export async function exchangeOAuthCode(code: string) {
  const config = requireGitHubConfig();

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.GITHUB_APP_CLIENT_ID,
        client_secret: config.GITHUB_APP_CLIENT_SECRET,
        code,
      }),
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("GitHub OAuth failed:", {
      status: response.status,
      error: data.error,
      description: data.error_description,
    });

    throw new Error(
      data.error_description || data.error || "GitHub authorization failed",
    );
  }

  return data as { access_token: string };
}
export async function getGitHubUser(token:string){return json<{login:string}>(await fetch(`${API}/user`,{headers:{...baseHeaders,Authorization:`Bearer ${token}`},cache:"no-store"}));}
async function installationToken(id:number){return (await json<{token:string}>(await fetch(`${API}/app/installations/${id}/access_tokens`,{method:"POST",headers:{...baseHeaders,Authorization:`Bearer ${appJwt()}`},cache:"no-store"}))).token;}
export async function installationRequest<T>(id:number,path:string){const token=await installationToken(id);return json<T>(await fetch(`${API}${path}`,{headers:{...baseHeaders,Authorization:`Bearer ${token}`},cache:"no-store"}));}
export async function listRepositories(id:number){const d=await installationRequest<{repositories:Array<{id:number;name:string;full_name:string;private:boolean;html_url:string;owner:{login:string};default_branch:string;description:string|null}>}>(id,"/installation/repositories?per_page=100");return d.repositories.map<GitHubRepository>(r=>({id:r.id,name:r.name,fullName:r.full_name,owner:r.owner.login,private:r.private,htmlUrl:r.html_url,defaultBranch:r.default_branch,description:r.description}));}
export async function listWorkflowRuns(id:number,owner:string,repo:string,limit=20){const safe=Math.min(Math.max(limit,1),50);const d=await installationRequest<{workflow_runs:Array<{id:number;name:string|null;display_title:string;status:string;conclusion:string|null;html_url:string;head_branch:string|null;head_sha:string;event:string;created_at:string;updated_at:string;actor:{login:string}|null}>}>(id,`/repos/${owner}/${repo}/actions/runs?per_page=${safe}`);return d.workflow_runs.map<GitHubWorkflowRun>(r=>({id:r.id,name:r.name??"Workflow",title:r.display_title,status:r.status,conclusion:r.conclusion,htmlUrl:r.html_url,branch:r.head_branch,sha:r.head_sha,event:r.event,createdAt:r.created_at,updatedAt:r.updated_at,actor:r.actor?.login??"github"}));}
export async function listJobs(id:number,owner:string,repo:string,runId:number){return (await installationRequest<{jobs:GitHubWorkflowJob[]}>(id,`/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`)).jobs;}
export async function getJobLogs(id:number,owner:string,repo:string,jobId:number){const token=await installationToken(id);const r=await fetch(`${API}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,{headers:{...baseHeaders,Authorization:`Bearer ${token}`},redirect:"follow",cache:"no-store"});if(!r.ok)throw new Error(`Unable to load logs (${r.status})`);return r.text();}
export async function listPullRequests(id:number,owner:string,repo:string){return installationRequest<Array<{number:number;title:string;state:string;html_url:string;user:{login:string};head:{ref:string};updated_at:string}>>(id,`/repos/${owner}/${repo}/pulls?state=all&sort=updated&per_page=10`);}
export function summarizeRuns(runs:GitHubWorkflowRun[]){const completed=runs.filter(r=>r.status==="completed"),successful=completed.filter(r=>r.conclusion==="success").length,failed=completed.filter(r=>r.conclusion&&r.conclusion!=="success").length;return{total:runs.length,completed:completed.length,successful,failed,inProgress:runs.length-completed.length,successRate:completed.length?Math.round(successful/completed.length*100):0};}
