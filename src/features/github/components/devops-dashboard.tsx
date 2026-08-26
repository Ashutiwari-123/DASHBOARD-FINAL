"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  GitHubRepository,
  GitHubRunsSummary,
  GitHubWorkflowJob,
  GitHubWorkflowRun,
} from "@/types/github";

type Api<T> = {
  success: boolean;
  data?: T;
  error?: { message: string };
};

type PullRequest = {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string };
  head: { ref: string };
  updated_at: string;
};

const emptySummary: GitHubRunsSummary = {
  total: 0,
  completed: 0,
  successful: 0,
  failed: 0,
  inProgress: 0,
  successRate: 0,
};

const repositoryQuery = (repository: GitHubRepository) =>
  `owner=${encodeURIComponent(repository.owner)}&repo=${encodeURIComponent(
    repository.name,
  )}`;

type IconName =
  | "github"
  | "refresh"
  | "search"
  | "external"
  | "repo"
  | "branch"
  | "logout";

function Icon({ name }: { name: IconName }) {
  const paths = {
    github: (
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
        <path d="M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2" />
        <path d="M20 20v-5h-5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    repo: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    branch: (
      <>
        <circle cx="6" cy="4" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="20" r="2" />
        <path d="M6 6v12M18 8a9 9 0 0 1-9 9" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function WorkflowStatusIcon({ run }: { run: GitHubWorkflowRun }) {
  const state =
    run.conclusion === "success"
      ? "ok"
      : run.status !== "completed"
        ? "wait"
        : "bad";

  return (
    <i className={`statusIcon ${state}`}>
      {state === "ok" ? "✓" : state === "wait" ? "↻" : "!"}
    </i>
  );
}

export function DevOpsDashboard() {
  const [connected, setConnected] = useState(false);
  const [login, setLogin] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepository, setSelectedRepository] =
    useState<GitHubRepository | null>(null);

  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [jobs, setJobs] = useState<GitHubWorkflowJob[]>([]);
  const [logs, setLogs] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<GitHubWorkflowRun | null>(null);
  const [repositorySearch, setRepositorySearch] = useState("");

  const loadRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repositories", {
        cache: "no-store",
      });

      const body = (await response.json()) as Api<{
        repositories: GitHubRepository[];
        login: string;
      }>;

      if (!response.ok || !body.data) {
        throw new Error(
          body.error?.message ?? "Unable to load repositories",
        );
      }

      setRepositories(body.data.repositories);
      setLogin(body.data.login);

      setSelectedRepository(
        (current) => current ?? body.data!.repositories[0] ?? null,
      );

      setConnected(true);
    } catch (cause) {
      setConnected(false);
      setError(
        cause instanceof Error ? cause.message : "Unable to connect",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/github/session", {
        cache: "no-store",
      });

      const body = (await response.json()) as Api<{
        connected: boolean;
        login: string | null;
      }>;

      setConnected(Boolean(body.data?.connected));
      setLogin(body.data?.login ?? null);

      if (body.data?.connected) {
        await loadRepositories();
      } else {
        setLoading(false);
      }
    })();
  }, [loadRepositories]);

  const loadProject = useCallback(
    async (repository: GitHubRepository) => {
      setLoading(true);
      setError(null);
      setJobs([]);
      setLogs("");
      setActiveRun(null);

      try {
        const query = repositoryQuery(repository);

        const [runsResponse, pullsResponse] = await Promise.all([
          fetch(`/api/github/runs?${query}&limit=30`, {
            cache: "no-store",
          }),
          fetch(`/api/github/pulls?${query}`, {
            cache: "no-store",
          }),
        ]);

        const runsBody = (await runsResponse.json()) as Api<{
          runs: GitHubWorkflowRun[];
          summary: GitHubRunsSummary;
        }>;

        const pullsBody = (await pullsResponse.json()) as Api<{
          pulls: PullRequest[];
        }>;

        if (!runsResponse.ok || !runsBody.data) {
          throw new Error(
            runsBody.error?.message ?? "Unable to load workflow runs",
          );
        }

        setRuns(runsBody.data.runs);
        setSummary(runsBody.data.summary);
        setPullRequests(pullsBody.data?.pulls ?? []);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load project",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedRepository) {
      return;
    }

    const timeout = window.setTimeout(
      () => void loadProject(selectedRepository),
      0,
    );

    return () => window.clearTimeout(timeout);
  }, [selectedRepository, loadProject]);

  async function openRun(run: GitHubWorkflowRun) {
    if (!selectedRepository) {
      return;
    }

    setActiveRun(run);
    setLogs("");
    setJobs([]);

    const response = await fetch(
      `/api/github/jobs?${repositoryQuery(
        selectedRepository,
      )}&runId=${run.id}`,
    );

    const body = (await response.json()) as Api<{
      jobs: GitHubWorkflowJob[];
    }>;

    setJobs(body.data?.jobs ?? []);
  }

  async function openLogs(job: GitHubWorkflowJob) {
    if (!selectedRepository) {
      return;
    }

    setLogs("Loading logs…");

    const response = await fetch(
      `/api/github/logs?${repositoryQuery(
        selectedRepository,
      )}&jobId=${job.id}`,
      {
        cache: "no-store",
      },
    );

    setLogs(
      response.ok
        ? await response.text()
        : "Logs are not available for this job.",
    );
  }

  async function disconnect() {
    await fetch("/api/github/session", {
      method: "DELETE",
    });

    setConnected(false);
    setRepositories([]);
    setSelectedRepository(null);
    setRuns([]);
  }

  const latestRuns = useMemo(() => runs.slice(0, 8), [runs]);

  const filteredRepositories = useMemo(
    () =>
      repositories.filter((repository) =>
        repository.name
          .toLowerCase()
          .includes(repositorySearch.toLowerCase()),
      ),
    [repositories, repositorySearch],
  );

  if (!connected && !loading) {
    return (
      <main className="landing">
        <nav>
          <b>
            <i>DS</i>
            DevScope
          </b>

          <a href="/api/github/connect">
            <Icon name="github" />
            Connect GitHub
          </a>
        </nav>

        <section className="hero">
          <span>GITHUB ACTIONS, MADE OBSERVABLE</span>

          <h1>
            Ship with context.
            <br />
            <em>Debug with confidence.</em>
          </h1>

          <p>
            Connect GitHub and turn every workflow run, pull request,
            job, and log into one focused engineering view.
          </p>

          <a href="/api/github/connect">
            <Icon name="github" />
            Connect your GitHub
            <b>↗</b>
          </a>

          <small>
            Repository-level access · Read-only permissions · Revoke
            anytime
          </small>
        </section>

        <section className="how">
          <article>
            <b>01</b>
            <h2>Connect securely</h2>
            <p>
              Choose exactly which repositories DevScope can read.
            </p>
          </article>

          <article>
            <b>02</b>
            <h2>See the signal</h2>
            <p>
              Understand CI health and failures without jumping between
              tabs.
            </p>
          </article>

          <article>
            <b>03</b>
            <h2>Inspect the detail</h2>
            <p>
              Open a run, browse its jobs, and read logs in context.
            </p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside>
        <div className="logo">
          <i>DS</i>
          <b>DevScope</b>
        </div>

        <div className="account">
          <i>{login?.slice(0, 2).toUpperCase() ?? "GH"}</i>

          <span>
            <small>GITHUB ACCOUNT</small>
            <b>@{login}</b>
          </span>

          <span className="liveDot" title="Connected" />
        </div>

        <div className="sideTitle">
          <span>REPOSITORIES</span>
          <b>{repositories.length}</b>
        </div>

        {repositories.length > 4 && (
          <label className="repoSearch">
            <Icon name="search" />

            <input
              aria-label="Search repositories"
              value={repositorySearch}
              onChange={(event) =>
                setRepositorySearch(event.target.value)
              }
              placeholder="Find a repository"
            />
          </label>
        )}

        <div className="repoList">
          {filteredRepositories.map((repository) => (
            <button
              className={
                selectedRepository?.id === repository.id
                  ? "selected"
                  : ""
              }
              onClick={() => setSelectedRepository(repository)}
              key={repository.id}
            >
              <Icon name="repo" />

              <span>
                <b>{repository.name}</b>
                <small>
                  {repository.owner} ·{" "}
                  {repository.private ? "Private" : "Public"}
                </small>
              </span>

              {selectedRepository?.id === repository.id && <em />}
            </button>
          ))}
        </div>

        <a className="add" href="/api/github/connect">
          ＋ Add repositories
        </a>

        <button className="disconnect" onClick={disconnect}>
          <Icon name="logout" />
          Disconnect GitHub
        </button>
      </aside>

      <section className="workspaceMain">
        <header className="topbar">
          <div>
            <small>
              WORKSPACE / {selectedRepository?.owner?.toUpperCase()}
            </small>

            <h1>
              {selectedRepository?.name ?? "Choose a repository"}
            </h1>

            <p>
              <i />
              Connected
              <span>·</span>
              <Icon name="branch" />
              {selectedRepository?.defaultBranch}
            </p>
          </div>

          <div>
            <button
              onClick={() =>
                selectedRepository &&
                void loadProject(selectedRepository)
              }
              disabled={loading}
            >
              <Icon name="refresh" />
              {loading ? "Syncing" : "Refresh"}
            </button>

            <a
              href={selectedRepository?.htmlUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" />
              GitHub
              <Icon name="external" />
            </a>
          </div>
        </header>

        {error && (
          <div className="alert">
            <b>Couldn’t sync this repository.</b>
            <span>{error}</span>
          </div>
        )}

        <div className="metrics">
          <article>
            <span>WORKFLOW RUNS</span>
            <b>{loading ? "—" : summary.total}</b>
            <small>Latest 30 runs</small>
            <em className="metricIcon">↗</em>
          </article>

          <article>
            <span>SUCCESS RATE</span>
            <b>{loading ? "—" : `${summary.successRate}%`}</b>
            <small>{summary.successful} successful runs</small>

            <div className="progress">
              <i style={{ width: `${summary.successRate}%` }} />
            </div>
          </article>

          <article>
            <span>IN PROGRESS</span>
            <b>{loading ? "—" : summary.inProgress}</b>
            <small>Running or queued</small>
            <em className="metricIcon blue">↻</em>
          </article>

          <article className="failureMetric">
            <span>OPEN FAILURES</span>
            <b>{loading ? "—" : summary.failed}</b>
            <small>
              {summary.failed
                ? "Needs your attention"
                : "Everything looks healthy"}
            </small>
            <em className="metricIcon red">!</em>
          </article>
        </div>

        <div className="grid">
          <article className="card runs">
            <div className="cardHead">
              <span>
                <h2>Recent workflow runs</h2>
                <p>Live activity from GitHub Actions</p>
              </span>

              <b>
                {selectedRepository?.private ? "Private" : "Public"}
              </b>
            </div>

            {latestRuns.map((run) => (
              <button onClick={() => void openRun(run)} key={run.id}>
                <WorkflowStatusIcon run={run} />

                <span>
                  <b>{run.title}</b>

                  <small>
                    {run.name} <i>·</i> {run.branch ?? "no branch"}{" "}
                    <i>·</i> <code>{run.sha.slice(0, 7)}</code>
                  </small>
                </span>

                <mark
                  className={
                    run.conclusion === "success"
                      ? "ok"
                      : run.status !== "completed"
                        ? "wait"
                        : "bad"
                  }
                >
                  {run.conclusion ?? run.status}
                </mark>

                <time>
                  {new Date(run.createdAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>

                <b className="chevron">›</b>
              </button>
            ))}

            {!loading && !latestRuns.length && (
              <div className="empty">
                <i>✓</i>
                <b>No workflow runs yet</b>
                <span>
                  Push a commit to a branch with a GitHub Actions
                  workflow.
                </span>
              </div>
            )}
          </article>

          <article className="card pulls">
            <div className="cardHead">
              <span>
                <h2>Pull requests</h2>
                <p>Recently updated</p>
              </span>

              <a
                href={
                  selectedRepository
                    ? `${selectedRepository.htmlUrl}/pulls`
                    : "#"
                }
                target="_blank"
                rel="noreferrer"
              >
                View all ↗
              </a>
            </div>

            {pullRequests.slice(0, 6).map((pullRequest) => (
              <a
                key={pullRequest.number}
                href={pullRequest.html_url}
                target="_blank"
                rel="noreferrer"
              >
                <i>#{pullRequest.number}</i>

                <span>
                  <b>{pullRequest.title}</b>
                  <small>
                    {pullRequest.head.ref} · {pullRequest.user.login}
                  </small>
                </span>

                <mark className={pullRequest.state}>
                  {pullRequest.state}
                </mark>
              </a>
            ))}

            {!loading && !pullRequests.length && (
              <div className="empty">
                <i>⌁</i>
                <b>No pull requests</b>
                <span>Open pull requests will appear here.</span>
              </div>
            )}
          </article>
        </div>
      </section>

      {activeRun && (
        <div className="modal" onClick={() => setActiveRun(null)}>
          <article onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>
                  WORKFLOW RUN ·{" "}
                  {activeRun.conclusion ?? activeRun.status}
                </small>

                <h2>{activeRun.title}</h2>

                <p>
                  {activeRun.name} · {activeRun.branch} ·{" "}
                  {activeRun.sha.slice(0, 7)}
                </p>
              </div>

              <div>
                <a
                  href={activeRun.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in GitHub ↗
                </a>

                <button
                  aria-label="Close"
                  onClick={() => setActiveRun(null)}
                >
                  ×
                </button>
              </div>
            </header>

            <div className="jobGrid">
              <div>
                <span className="jobTitle">JOBS</span>

                {jobs.map((job) => (
                  <button
                    onClick={() => void openLogs(job)}
                    key={job.id}
                  >
                    <i
                      className={
                        job.conclusion === "success" ? "ok" : "bad"
                      }
                    >
                      {job.conclusion === "success" ? "✓" : "!"}
                    </i>

                    <span>
                      <b>{job.name}</b>
                      <small>
                        {job.status} · {job.conclusion ?? "running"}
                      </small>
                    </span>

                    <b>View logs</b>
                  </button>
                ))}

                {!jobs.length && (
                  <div className="empty">Loading jobs…</div>
                )}
              </div>

              <pre>
                {logs ||
                  "Select a job on the left to inspect its log output."}
              </pre>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}