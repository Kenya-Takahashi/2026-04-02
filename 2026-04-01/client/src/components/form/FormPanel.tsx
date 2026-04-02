import type { PromptFormState } from '../../types/form';
import type { FormDispatch } from '../../hooks/useFormState';
import { AccordionSection } from './AccordionSection';
import { AppOverviewSection } from './sections/AppOverviewSection';
import { ScreenLayoutSection } from './sections/ScreenLayoutSection';
import { TechStackSection } from './sections/TechStackSection';
import { DesignTasteSection } from './sections/DesignTasteSection';
import { AuthApiSection } from './sections/AuthApiSection';
import { DbErSection } from './sections/DbErSection';
import { WireframeSection } from './sections/WireframeSection';
import { CiCdSection } from './sections/CiCdSection';

interface FormPanelProps {
  state: PromptFormState;
  dispatch: FormDispatch;
}

export function FormPanel({ state, dispatch }: FormPanelProps) {
  return (
    <div className="space-y-3">
      <AccordionSection title="1. アプリ概要・目的" defaultOpen>
        <AppOverviewSection
          data={state.appOverview}
          onChange={(d) => dispatch({ type: 'UPDATE_APP_OVERVIEW', payload: d })}
        />
      </AccordionSection>

      <AccordionSection title="2. 画面構成">
        <ScreenLayoutSection
          data={state.screenLayout}
          onChange={(d) => dispatch({ type: 'UPDATE_SCREEN_LAYOUT', payload: d })}
          onSetScreens={(s) => dispatch({ type: 'SET_SCREENS', payload: s })}
        />
      </AccordionSection>

      <AccordionSection title="3. 技術スタック">
        <TechStackSection
          data={state.techStack}
          onChange={(d) => dispatch({ type: 'UPDATE_TECH_STACK', payload: d })}
        />
      </AccordionSection>

      <AccordionSection title="4. デザインテイスト">
        <DesignTasteSection
          data={state.designTaste}
          onChange={(d) => dispatch({ type: 'UPDATE_DESIGN_TASTE', payload: d })}
        />
      </AccordionSection>

      <AccordionSection title="5. 認証・API連携">
        <AuthApiSection
          data={state.authApi}
          onChange={(d) => dispatch({ type: 'UPDATE_AUTH_API', payload: d })}
          onSetApis={(apis) => dispatch({ type: 'SET_EXTERNAL_APIS', payload: apis })}
        />
      </AccordionSection>

      {state.mode === 'detailed' && (
        <>
          <AccordionSection title="6. ER図・DB設計">
            <DbErSection
              tables={state.dbDesign.tables}
              onChange={(tables) => dispatch({ type: 'UPDATE_DB_DESIGN', payload: { tables } })}
            />
          </AccordionSection>

          <AccordionSection title="7. ページ別ワイヤーフレーム">
            <WireframeSection
              wireframes={state.wireframes}
              screens={state.screenLayout.screens}
              onChange={(wf) => dispatch({ type: 'SET_WIREFRAMES', payload: wf })}
            />
          </AccordionSection>

          <AccordionSection title="8. CI/CD・Docker構成">
            <CiCdSection
              data={state.ciCd}
              onChange={(d) => dispatch({ type: 'UPDATE_CICD', payload: d })}
            />
          </AccordionSection>
        </>
      )}
    </div>
  );
}
