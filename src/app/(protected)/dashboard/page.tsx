'use client'
import React from 'react'
import { useUser } from "@clerk/nextjs"
import { useProjectsCtx } from '@/hooks/project-context';
import { Github, ExternalLink } from 'lucide-react';
import { CommitLog } from './commit-log';

const DashboardPage = () => {
  const { user } = useUser();
  const { project, projectId } = useProjectsCtx();

  return (
    <div key={projectId} className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between flex-wrap gap-y-4 mb-6">
        {/* GitHub Link Banner */}
        <div className="w-fit rounded-md bg-primary px-4 py-3 flex items-center">
          <Github className="size-5 text-white" />
          <p className="ml-2 text-sm font-medium text-white">
            This project is linked to
          </p>
          {project?.githuburl && (
            <a
              href={project.githuburl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white/80 hover:underline ml-2"
            >
              {project.githuburl}
              <ExternalLink className="ml-1 size-4" />
            </a>
          )}
        </div>
      </div>
      {/* Team members, Invite, Archive section placeholder */}
      {/* --- GitHub link --- */}
      <div className="h-4" />
      <div className="flex items-center gap-4">
        {/* Placeholder for team members, invite, archive */}
        <span className="text-muted-foreground">[Team members, Invite, Archive buttons here]</span>
      </div>

      {/* Main content grid for Ask Question and Meeting cards */}
      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-5">
        {/* Ask Question Card */}
        <div className="col-span-1 sm:col-span-3">
          <div className="bg-muted rounded-md p-4 h-40 flex items-center justify-center">
            [Ask Question Card Placeholder]
          </div>
        </div>
        {/* Meeting Card */}
        <div className="col-span-1 sm:col-span-2">
          <div className="bg-muted rounded-md p-4 h-40 flex items-center justify-center">
            [Meeting Card Placeholder]
          </div>
        </div>
      </div>

      {/* Commit Log Section */}
      <div className="mt-8">
        <div className="bg-muted rounded-md p-4 min-h-[200px]">
          <CommitLog />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;