'use client';
import { api } from '@/trpc/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

// Define the form input type
type FormInput = {
  repourl: string;
  projectName: string;
  githubtoken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();

  function onSubmit(data: FormInput) {
    createProject.mutate({
      githuburl: data.repourl,
      name: data.projectName,
      // githubtoken: data.githubtoken // uncomment if your backend supports this
    }, {
      onSuccess: () => {
        toast.success('Project created successfully');
        reset();
      },
      onError: () => {
        toast.error('Failed to create Project');
      }
    });
    return true;
  }

  return (
    <div className="flex items-center gap-12 h-full justify-center">
      <img src="/undraw_github.svg" className="h-56 w-auto" alt="GitHub Illustration" />
      <div>
        <h1 className="font-semibold text-2xl">Link your GitHub repository</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the URL of your repository to link it to RepoBrief.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1">Project Name</label>
            <input
              {...register('projectName', { required: true })}
              className="border px-2 py-1 rounded w-full"
              placeholder="My Project"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Repository URL</label>
            <input
              {...register('repourl', { required: true })}
              className="border px-2 py-1 rounded w-full"
              placeholder="https://github.com/username/repo"
              type="url"
              required
            />
          </div>
          <div>
            <label className="block mb-1">GitHub Token (optional)</label>
            <input
              {...register('githubtoken')}
              className="border px-2 py-1 rounded w-full"
              placeholder="Personal Access Token"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Project</button>
        </form>
      </div>
    </div>
  );
};

export default CreatePage;

