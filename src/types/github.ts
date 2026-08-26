export type GitHubRepository={id:number;name:string;fullName:string;owner:string;private:boolean;htmlUrl:string;defaultBranch:string;description:string|null};
export type GitHubWorkflowRun={id:number;name:string;title:string;status:string;conclusion:string|null;htmlUrl:string;branch:string|null;sha:string;event:string;createdAt:string;updatedAt:string;actor:string};
export type GitHubRunsSummary={total:number;completed:number;successful:number;failed:number;inProgress:number;successRate:number};
export type GitHubWorkflowJob={id:number;name:string;status:string;conclusion:string|null;html_url:string;started_at:string|null;completed_at:string|null;steps?:Array<{name:string;status:string;conclusion:string|null;number:number;started_at:string|null;completed_at:string|null}>};
