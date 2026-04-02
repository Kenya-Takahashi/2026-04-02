import { useReducer } from 'react';
import { initialFormState } from '../types/form';
import type { PromptFormState, TabType, Screen, ExternalApi, Table, Wireframe } from '../types/form';

type Action =
  | { type: 'SET_MODE'; payload: TabType }
  | { type: 'UPDATE_APP_OVERVIEW'; payload: Partial<PromptFormState['appOverview']> }
  | { type: 'UPDATE_SCREEN_LAYOUT'; payload: Partial<PromptFormState['screenLayout']> }
  | { type: 'SET_SCREENS'; payload: Screen[] }
  | { type: 'UPDATE_TECH_STACK'; payload: Partial<PromptFormState['techStack']> }
  | { type: 'UPDATE_DESIGN_TASTE'; payload: Partial<PromptFormState['designTaste']> }
  | { type: 'UPDATE_AUTH_API'; payload: Partial<PromptFormState['authApi']> }
  | { type: 'SET_EXTERNAL_APIS'; payload: ExternalApi[] }
  | { type: 'UPDATE_DB_DESIGN'; payload: { tables: Table[] } }
  | { type: 'SET_WIREFRAMES'; payload: Wireframe[] }
  | { type: 'UPDATE_CICD'; payload: Partial<PromptFormState['ciCd']> }
  | { type: 'LOAD_TEMPLATE'; payload: PromptFormState }
  | { type: 'RESET' };

function formReducer(state: PromptFormState, action: Action): PromptFormState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'UPDATE_APP_OVERVIEW':
      return { ...state, appOverview: { ...state.appOverview, ...action.payload } };
    case 'UPDATE_SCREEN_LAYOUT':
      return { ...state, screenLayout: { ...state.screenLayout, ...action.payload } };
    case 'SET_SCREENS':
      return { ...state, screenLayout: { ...state.screenLayout, screens: action.payload } };
    case 'UPDATE_TECH_STACK':
      return { ...state, techStack: { ...state.techStack, ...action.payload } };
    case 'UPDATE_DESIGN_TASTE':
      return { ...state, designTaste: { ...state.designTaste, ...action.payload } };
    case 'UPDATE_AUTH_API':
      return { ...state, authApi: { ...state.authApi, ...action.payload } };
    case 'SET_EXTERNAL_APIS':
      return { ...state, authApi: { ...state.authApi, externalApis: action.payload } };
    case 'UPDATE_DB_DESIGN':
      return { ...state, dbDesign: action.payload };
    case 'SET_WIREFRAMES':
      return { ...state, wireframes: action.payload };
    case 'UPDATE_CICD':
      return { ...state, ciCd: { ...state.ciCd, ...action.payload } };
    case 'LOAD_TEMPLATE':
      return action.payload;
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
}

export function useFormState() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  return { state, dispatch };
}

export type FormDispatch = React.Dispatch<Action>;
