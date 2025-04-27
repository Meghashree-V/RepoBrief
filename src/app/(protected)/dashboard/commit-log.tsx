"use client";
import React from "react";
import { api } from "@/trpc/react";
import { useProjectsCtx } from "@/hooks/project-context";

export function CommitLog() {
  const { project } = useProjectsCtx();
  const projectId = project?.id;
  const {
    data: commits,
    isLoading,
    error,
  } = api.project.pullCommits.useQuery(
    { projectId: projectId ?? "" },
    { enabled: !!projectId }
  );

  if (!projectId) {
    return <div className="text-muted-foreground">Select a project to view commits.</div>;
  }
  if (isLoading) {
    return <div>Loading commits...</div>;
  }
  if (error) {
    return <div className="text-destructive">Error loading commits: {error.message}</div>;
  }
  if (!commits || commits.length === 0) {
    return <div>No new commits found.</div>;
  }
  return (
    <div className="w-full">
      <h3 className="font-semibold mb-2">Recent Commits</h3>
      <ul className="space-y-2">
        {commits.map((commit, idx) => (
          <li key={commit.committedAt + commit.message + idx} className="p-2 bg-white/5 rounded">
            <div className="font-medium">{commit.message}</div>
            <div className="text-xs text-muted-foreground flex gap-2 items-center">
              <span>by {commit.authorName}</span>
              <span>•</span>
              <span>{new Date(commit.committedAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
