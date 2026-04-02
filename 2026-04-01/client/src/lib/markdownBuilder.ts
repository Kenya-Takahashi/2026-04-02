import type { PromptFormState } from '../types/form';
import {
  LAYOUT_PATTERNS,
  FRONTEND_OPTIONS,
  BACKEND_OPTIONS,
  DATABASE_OPTIONS,
  DESIGN_STYLE_OPTIONS,
  COLOR_THEME_OPTIONS,
  AUTH_OPTIONS,
  CONTAINER_OPTIONS,
  DEPLOY_OPTIONS,
  CI_OPTIONS,
} from './constants';

function resolveLabel(value: string, customValue: string, options: { value: string; label: string }[]): string {
  if (value === 'other') return customValue || 'その他';
  const opt = options.find((o) => o.value === value);
  return opt?.label || value;
}

function resolveMultiLabel(values: string[], customValue: string, options: { value: string; label: string }[]): string {
  const labels = values.map((v) => {
    if (v === 'other') return customValue || 'その他';
    const opt = options.find((o) => o.value === v);
    return opt?.label || v;
  });
  return labels.join(', ');
}

export function buildMarkdown(state: PromptFormState): string {
  const sections: string[] = [];

  // Title
  const title = state.appOverview.appName || 'アプリ名未設定';
  sections.push(`# ${title}`);

  // 概要
  if (state.appOverview.description) {
    sections.push(`## 概要\n${state.appOverview.description}`);
  }

  // 目的・ゴール
  if (state.appOverview.goals) {
    sections.push(`## 目的・ゴール\n${state.appOverview.goals}`);
  }

  // 技術スタック
  {
    const lines: string[] = [];
    if (state.techStack.frontend) {
      lines.push(`- フロントエンド: ${resolveLabel(state.techStack.frontend, state.techStack.frontendCustom, FRONTEND_OPTIONS)}`);
    }
    if (state.techStack.backend) {
      lines.push(`- バックエンド: ${resolveLabel(state.techStack.backend, state.techStack.backendCustom, BACKEND_OPTIONS)}`);
    }
    if (state.techStack.database) {
      lines.push(`- データベース: ${resolveLabel(state.techStack.database, state.techStack.databaseCustom, DATABASE_OPTIONS)}`);
    }
    if (state.techStack.language) {
      lines.push(`- 言語: ${state.techStack.language}`);
    }
    if (lines.length > 0) {
      sections.push(`## 技術スタック\n${lines.join('\n')}`);
    }
  }

  // デザイン
  {
    const lines: string[] = [];
    if (state.designTaste.baseStyle) {
      lines.push(`- テイスト: ${resolveLabel(state.designTaste.baseStyle, state.designTaste.baseStyleCustom, DESIGN_STYLE_OPTIONS)}`);
    }
    if (state.designTaste.colorTheme) {
      lines.push(`- カラーテーマ: ${resolveLabel(state.designTaste.colorTheme, '', COLOR_THEME_OPTIONS)}`);
    }
    if (state.designTaste.additionalNotes) {
      lines.push(`- 補足: ${state.designTaste.additionalNotes}`);
    }
    if (lines.length > 0) {
      sections.push(`## デザイン\n${lines.join('\n')}`);
    }
  }

  // 画面構成
  {
    const lines: string[] = [];
    if (state.screenLayout.pattern) {
      lines.push(`- レイアウト: ${resolveLabel(state.screenLayout.pattern, state.screenLayout.patternCustom, LAYOUT_PATTERNS)}`);
    }
    const filledScreens = state.screenLayout.screens.filter((s) => s.name);
    if (filledScreens.length > 0) {
      lines.push(`- 画面数: ${filledScreens.length}`);
      lines.push('');
      lines.push('| 画面名 | 概要 |');
      lines.push('|--------|------|');
      for (const s of filledScreens) {
        lines.push(`| ${s.name} | ${s.description} |`);
      }
    }
    if (lines.length > 0) {
      sections.push(`## 画面構成\n${lines.join('\n')}`);
    }
  }

  // 認証・API連携
  {
    const lines: string[] = [];
    if (state.authApi.authMethods.length > 0) {
      lines.push(`- 認証方式: ${resolveMultiLabel(state.authApi.authMethods, state.authApi.authCustom, AUTH_OPTIONS)}`);
    }
    const filledApis = state.authApi.externalApis.filter((a) => a.name);
    if (filledApis.length > 0) {
      lines.push('- 外部API:');
      for (const api of filledApis) {
        lines.push(`  - ${api.name}: ${api.usage}`);
      }
    }
    if (lines.length > 0) {
      sections.push(`## 認証・API連携\n${lines.join('\n')}`);
    }
  }

  // 詳細版のみのセクション
  if (state.mode === 'detailed') {
    // DB設計
    {
      const filledTables = state.dbDesign.tables.filter((t) => t.name);
      if (filledTables.length > 0) {
        const tableLines: string[] = ['## DB設計'];
        for (const table of filledTables) {
          tableLines.push(`\n### ${table.name}`);
          if (table.columns) {
            const columnLines = table.columns.split('\n').filter((l) => l.trim());
            if (columnLines.length > 0) {
              tableLines.push('| カラム名 | 型 |');
              tableLines.push('|---------|-----|');
              for (const line of columnLines) {
                const parts = line.split(':').map((p) => p.trim());
                if (parts.length >= 2) {
                  tableLines.push(`| ${parts[0]} | ${parts.slice(1).join(':')} |`);
                } else {
                  tableLines.push(`| ${parts[0]} | - |`);
                }
              }
            }
          }
          if (table.relations) {
            tableLines.push(`\nリレーション: ${table.relations}`);
          }
        }
        sections.push(tableLines.join('\n'));
      }
    }

    // ページ別ワイヤーフレーム
    {
      const filledWireframes = state.wireframes.filter(
        (w) => w.components || w.userFlow || w.stateNotes
      );
      if (filledWireframes.length > 0) {
        const wfLines: string[] = ['## ページ別ワイヤーフレーム'];
        for (const wf of filledWireframes) {
          wfLines.push(`\n### ${wf.screenName}`);
          if (wf.components) wfLines.push(`- 主要コンポーネント: ${wf.components}`);
          if (wf.userFlow) wfLines.push(`- 操作フロー: ${wf.userFlow}`);
          if (wf.stateNotes) wfLines.push(`- 状態管理: ${wf.stateNotes}`);
        }
        sections.push(wfLines.join('\n'));
      }
    }

    // CI/CD・Docker
    {
      const lines: string[] = [];
      if (state.ciCd.containerConfig) {
        lines.push(`- コンテナ構成: ${resolveLabel(state.ciCd.containerConfig, state.ciCd.containerCustom, CONTAINER_OPTIONS)}`);
      }
      if (state.ciCd.deployTarget) {
        lines.push(`- デプロイ先: ${resolveLabel(state.ciCd.deployTarget, state.ciCd.deployCustom, DEPLOY_OPTIONS)}`);
      }
      if (state.ciCd.ciTools.length > 0) {
        lines.push(`- CI/CD: ${resolveMultiLabel(state.ciCd.ciTools, state.ciCd.ciCustom, CI_OPTIONS)}`);
      }
      if (lines.length > 0) {
        sections.push(`## CI/CD・Docker\n${lines.join('\n')}`);
      }
    }
  }

  return sections.join('\n\n');
}
