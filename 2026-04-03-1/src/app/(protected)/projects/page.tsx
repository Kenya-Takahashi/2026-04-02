import Link from "next/link";

import { DemoDataButton } from "@/components/demo/DemoDataButton";
import { Header } from "@/components/layout/Header";
import { ProjectCreateForm } from "@/components/project/ProjectCreateForm";
import { listProjects } from "@/lib/actions/tasks";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-8">
      <Header
        title="Projects"
        description="研究テーマごとに task をまとめて、Epic から Story・Task へ段階的に分解していきます。"
      />

      <section className="soft-card">
        <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">New Project</p>
        <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">新しい研究プロジェクトを作成</h3>
        <p className="mt-2 text-sm leading-7 text-[--text-secondary]">
          大きな研究の流れをひとまとまりにして、ここから task を育てていきます。
        </p>
        <div className="mt-4">
          <DemoDataButton compact />
        </div>
        <ProjectCreateForm />
      </section>

      {projects.length === 0 ? (
        <section className="soft-card">
          <p className="text-sm leading-7 text-[--text-secondary]">
            まだプロジェクトがありません。最初の研究テーマを 1 つ作って、Epic から分解を始めましょう。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-[28px] border border-[--border] bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-[--accent-blue]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">
                    {project.status}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">{project.name}</h3>
                </div>
                <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary]">
                  {project.taskCount} tasks
                </span>
              </div>
              <p className="mt-3 min-h-[4.5rem] text-sm leading-7 text-[--text-secondary]">
                {project.description || "まだ説明はありません。"}
              </p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-[--text-secondary]">未完了 {project.openTaskCount}</span>
                <span className="font-medium text-[--accent-blue]">詳細を見る</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
