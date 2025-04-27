// src/lib/github.ts
// Utility module for interacting with GitHub using Octokit

import "dotenv/config";
import { Octokit } from "octokit";

// Debug: print the GitHub token being used
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN);

// You will need to provide a GitHub token via environment variable or config
const GITHUB_TOKEN: string = process.env.GITHUB_TOKEN ?? "";

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

/**
 * Extracts owner and repo from a GitHub URL using URL API.
 * Throws if invalid.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid GitHub URL");
  }
  if (parsed.hostname !== "github.com") throw new Error("Invalid GitHub URL");
  const segments = parsed.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
  if (segments.length < 2) throw new Error("Invalid GitHub URL");
  // segments[0] and segments[1] are defined, assert non-null
  const owner = segments[0]!;
  const repo = segments[1]!;
  return { owner, repo };
}

/**
 * Fetch commit hashes and basic info from a GitHub repository.
 */
export async function getCommitHashes(githubUrl: string): Promise<Array<{ hash: string; message: string; author: string; date: string }>> {
  const { owner, repo } = parseGitHubUrl(githubUrl);
  const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 20, // adjust as needed
  });

  const commits = response.data ?? [];
  return commits.map(commit => ({
    hash: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.name ?? "Unknown",
    date: commit.commit.author?.date ?? "Unknown",
  }));
}

// Example: fetch commits for a repo
export async function fetchCommits(owner: string, repo: string) {
  const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 20,
  });
  return response.data;
}

// Add more GitHub API helpers as needed

// Use local Prisma client for type-safe model access
import { prisma } from "./prisma";

/**
 * Fetch the project and its GitHub URL by projectId from the database
 */
async function fetchProjectGithubUrl(projectId: string) {
  const project = await (prisma as any).project.findUnique({
    where: { id: projectId },
    select: { id: true, githuburl: true }
  });
  if (!project || !project.githuburl) {
    throw new Error("Project or GitHub URL not found");
  }
  return { project, githubUrl: project.githuburl };
}

/**
 * Filter out commits that are already saved in the DB for this project
 */
async function filterOutUnprocessedCommits(projectId: string, commitHashes: string[]) {
  const processed = await (prisma as any).commit.findMany({
    where: {
      projectId,
      commitHash: { in: commitHashes }
    },
    select: { commitHash: true }
  });
  const processedHashes = new Set(processed.map((c: { commitHash: string }) => c.commitHash));
  // Return only new commit hashes
  return commitHashes.filter((hash: string) => !processedHashes.has(hash));
}

/**
 * Pull latest commits from GitHub for a project, filter out already-processed ones
 * Returns up to 10 new commits, each as an object with message, authorName, authorAvatar, committedAt
 */
export async function pullCommit(projectId: string) {
  // Step 1: Get project and GitHub URL
  const { githubUrl } = await fetchProjectGithubUrl(projectId);

  // Step 2: Get latest commits from GitHub
  const commits = await getCommitHashes(githubUrl); // [{ hash, message, author, date }]

  // Step 3: Filter out already-processed commits
  const newHashes = await filterOutUnprocessedCommits(
    projectId,
    commits.map(c => c.hash)
  );

  // Step 4: Get full commit objects for only new commits, limit to 10, remove hash
  type CommitShape = { hash: string; message: string; author: string; date: string };
  const unprocessedCommits = (commits as CommitShape[])
    .filter((c: CommitShape) => newHashes.includes(c.hash))
    .slice(0, 10)
    .map((commit: CommitShape) => ({
      message: commit.message,
      authorName: commit.author,
      authorAvatar: null, // You can enhance this if you want to fetch avatar
      committedAt: commit.date,
    }));

  return unprocessedCommits;
}

// TEMP: Automated test: try user's repo, then fallback to public repo if 404
if (import.meta.main) {
  (async () => {
    const testRepos = [
      "https://github.com/Meghashree-V/ComplainHub", // user's repo
      "https://github.com/octocat/Hello-World"      // fallback public repo
    ];
    for (const url of testRepos) {
      try {
        const { owner, repo } = parseGitHubUrl(url);
        console.log("Trying repo:", owner, repo);
        const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner,
          repo,
          per_page: 20,
        });
        // Sort by date descending and map to type-safe object
        const sortedCommits = [...response.data].sort((a, b) => {
          const dateA = new Date(a.commit?.author?.date ?? 0).getTime();
          const dateB = new Date(b.commit?.author?.date ?? 0).getTime();
          return dateB - dateA;
        });
        const result = sortedCommits.slice(0, 15).map(commit => ({
          hash: commit.sha as string,
          message: commit.commit?.message as string,
          authorName: commit.commit?.author?.name ?? "Unknown",
          authorAvatar: commit.author?.avatar_url ?? null,
          committedAt: commit.commit?.author?.date ?? null,
        }));
        console.log(result);
        return;
      } catch (err: any) {
        if (err.status === 404) {
          console.error(`Repo not found: ${url}. Trying next...`);
        } else {
          console.error("Error fetching commits:", err);
          return;
        }
      }
    }
    console.error("All test repos failed. Please check your token and repo access.");
  })();
}
