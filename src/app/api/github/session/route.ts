import {NextResponse} from "next/server";import {getGitHubSession,SESSION_COOKIE} from "@/lib/github-session";
export async function GET(){const session=await getGitHubSession();return NextResponse.json({success:true,data:{connected:Boolean(session),login:session?.login??null}});}
export async function DELETE(){const response=NextResponse.json({success:true,data:{connected:false}});response.cookies.delete(SESSION_COOKIE);return response;}
