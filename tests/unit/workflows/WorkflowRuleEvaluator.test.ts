import { describe, it, expect, vi } from 'vitest';
import { WorkflowRuleEvaluator } from '@plugins/workflows/WorkflowRuleEvaluator';
import { aWorkflowConfig, aTimeLog } from '@tests/shared/builders/entity-builders';
import { IWorkflowRule, WorkflowCheckResult } from '@common/workflows/IWorkflow';

describe('WorkflowRuleEvaluator', () => {
  const evaluator = new WorkflowRuleEvaluator();

  it('should return not stopped and false warning when active logs array is empty without evaluating rules', () => {
    // Arrange
    const mockRule: IWorkflowRule = {
      id: 'mock_rule',
      evaluate: vi.fn(),
    };
    const config = aWorkflowConfig({ autoStopHoursLimitEnabled: true });
    const nowMs = 1700000000000;

    // Act
    const result = evaluator.evaluate([mockRule], config, [], nowMs);

    // Assert
    expect(result.stopped).toBe(false);
    expect(result.warning).toBe(false);
    expect(mockRule.evaluate).not.toHaveBeenCalled();
  });

  it('should evaluate rules sequentially and return stopped immediately when first rule triggers stop', () => {
    // Arrange
    const activeLog = aTimeLog({ id: 'log-1', endTime: null });
    const config = aWorkflowConfig();
    const nowMs = 1700000000000;

    const stopResult: WorkflowCheckResult = {
      stopped: true,
      reason: 'hours_limit',
      warning: false,
    };
    const firstRule: IWorkflowRule = {
      id: 'first_rule',
      evaluate: vi.fn().mockReturnValue(stopResult),
    };
    const secondRule: IWorkflowRule = {
      id: 'second_rule',
      evaluate: vi.fn(),
    };

    // Act
    const result = evaluator.evaluate([firstRule, secondRule], config, [activeLog], nowMs);

    // Assert
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('hours_limit');
    expect(firstRule.evaluate).toHaveBeenCalledWith(config, [activeLog], nowMs);
    expect(secondRule.evaluate).not.toHaveBeenCalled();
  });

  it('should aggregate warning flag when a rule indicates warning without stopping', () => {
    // Arrange
    const activeLog = aTimeLog({ id: 'log-1', endTime: null });
    const config = aWorkflowConfig();
    const nowMs = 1700000000000;

    const warnResult: WorkflowCheckResult = {
      stopped: false,
      warning: true,
    };
    const firstRule: IWorkflowRule = {
      id: 'warn_rule',
      evaluate: vi.fn().mockReturnValue(warnResult),
    };
    const secondRule: IWorkflowRule = {
      id: 'ok_rule',
      evaluate: vi.fn().mockReturnValue(null),
    };

    // Act
    const result = evaluator.evaluate([firstRule, secondRule], config, [activeLog], nowMs);

    // Assert
    expect(result.stopped).toBe(false);
    expect(result.warning).toBe(true);
    expect(firstRule.evaluate).toHaveBeenCalledWith(config, [activeLog], nowMs);
    expect(secondRule.evaluate).toHaveBeenCalledWith(config, [activeLog], nowMs);
  });

  it('should return not stopped and false warning when all rules return null', () => {
    // Arrange
    const activeLog = aTimeLog({ id: 'log-1', endTime: null });
    const config = aWorkflowConfig();
    const nowMs = 1700000000000;

    const rule: IWorkflowRule = {
      id: 'noop_rule',
      evaluate: vi.fn().mockReturnValue(null),
    };

    // Act
    const result = evaluator.evaluate([rule], config, [activeLog], nowMs);

    // Assert
    expect(result.stopped).toBe(false);
    expect(result.warning).toBe(false);
  });
});
