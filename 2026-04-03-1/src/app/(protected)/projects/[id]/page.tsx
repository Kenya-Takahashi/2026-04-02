import { notFound } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { TaskTree } from "@/components/task/TaskTree";
import { getProject, getTaskTree } from "@/lib/actions/tasks";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  const tree = await getTaskTree(project.id);

  return (
    <div className="space-y-8">
      <Header
        title={project.name}
        description={
          project.description ?? "Epic > Story > Task の3段階で、研究タスクを少しずつ具体化していきます。"
        }
        actions={
          <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Status</p>
            <p className="mt-1 text-lg font-medium text-[--text-primary]">{project.status}</p>
          </div>
        }
      />

      <TaskTree projectId={project.id} nodes={tree} />
    </div>
  );
}
