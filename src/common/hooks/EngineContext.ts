/**
 * @deprecated EngineContext is deprecated and renamed to WindowShellContext (SRP/KISS).
 * Please import from '@common/contexts/WindowShellContext'.
 */
export {
  type WindowShellState as EngineState,
  WindowShellContext as EngineContext,
  useWindowShell as useEngine,
} from '../contexts/WindowShellContext';
