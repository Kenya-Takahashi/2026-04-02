export interface Screen {
  name: string;
  description: string;
}

export interface ExternalApi {
  name: string;
  usage: string;
}

export interface Column {
  name: string;
  type: string;
}

export interface Table {
  name: string;
  columns: string; // "カラム名: 型" を1行ずつ
  relations: string;
}

export interface Wireframe {
  screenName: string;
  components: string;
  userFlow: string;
  stateNotes: string;
}

export interface AppOverview {
  appName: string;
  description: string;
  goals: string;
}

export interface ScreenLayout {
  pattern: string;
  patternCustom: string;
  screenCount: number;
  screens: Screen[];
}

export interface TechStack {
  frontend: string;
  frontendCustom: string;
  backend: string;
  backendCustom: string;
  database: string;
  databaseCustom: string;
  language: string;
}

export interface DesignTaste {
  baseStyle: string;
  baseStyleCustom: string;
  colorTheme: string;
  additionalNotes: string;
}

export interface AuthApi {
  authMethods: string[];
  authCustom: string;
  externalApis: ExternalApi[];
}

export interface DbDesign {
  tables: Table[];
}

export interface CiCd {
  containerConfig: string;
  containerCustom: string;
  deployTarget: string;
  deployCustom: string;
  ciTools: string[];
  ciCustom: string;
}

export type TabType = 'simple' | 'detailed';

export interface PromptFormState {
  mode: TabType;
  appOverview: AppOverview;
  screenLayout: ScreenLayout;
  techStack: TechStack;
  designTaste: DesignTaste;
  authApi: AuthApi;
  dbDesign: DbDesign;
  wireframes: Wireframe[];
  ciCd: CiCd;
}

export const initialFormState: PromptFormState = {
  mode: 'simple',
  appOverview: {
    appName: '',
    description: '',
    goals: '',
  },
  screenLayout: {
    pattern: '',
    patternCustom: '',
    screenCount: 1,
    screens: [{ name: '', description: '' }],
  },
  techStack: {
    frontend: '',
    frontendCustom: '',
    backend: '',
    backendCustom: '',
    database: '',
    databaseCustom: '',
    language: 'TypeScript',
  },
  designTaste: {
    baseStyle: '',
    baseStyleCustom: '',
    colorTheme: '',
    additionalNotes: '',
  },
  authApi: {
    authMethods: [],
    authCustom: '',
    externalApis: [],
  },
  dbDesign: {
    tables: [],
  },
  wireframes: [],
  ciCd: {
    containerConfig: '',
    containerCustom: '',
    deployTarget: '',
    deployCustom: '',
    ciTools: [],
    ciCustom: '',
  },
};
