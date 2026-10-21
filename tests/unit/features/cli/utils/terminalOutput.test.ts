import { describe, it, expect } from 'vitest';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';
import { TerminalLine } from '@features/cli/types';

describe('Unit Tests: TerminalOutput', () => {
  it('should push formatted lines for status methods', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    output
      .info('Info message')
      .success('Success message')
      .error('Error message')
      .output('Output message')
      .input('Input command')
      .empty();

    const lines = output.getLines();

    // Assert
    expect(lines).toHaveLength(6);
    expect(lines[0]).toEqual({ text: 'Info message', type: 'info' });
    expect(lines[1]).toEqual({ text: 'Success message', type: 'success' });
    expect(lines[2]).toEqual({ text: 'Error message', type: 'error' });
    expect(lines[3]).toEqual({ text: 'Output message', type: 'output' });
    expect(lines[4]).toEqual({ text: 'Input command', type: 'input' });
    expect(lines[5]).toEqual({ text: '', type: 'output' });
  });

  it('should render a formatted ASCII table with headers and borders', () => {
    // Arrange
    const output = new TerminalOutput();
    const headers = [
      { label: 'ID', width: 4 },
      { label: 'Name', width: 10 }
    ];
    const rows = [
      { cells: ['1', 'Alpha'], type: 'output' as const },
      { cells: ['2', 'Beta'], type: 'success' as const }
    ];

    // Act
    output.table(headers, rows);
    const lines = output.getLines();

    // Assert
    expect(lines.length).toBe(6);
    expect(lines[0].text).toContain('┌');
    expect(lines[1].text).toContain('ID');
    expect(lines[2].text).toContain('├');
    expect(lines[3].text).toContain('Alpha');
    expect(lines[4].text).toContain('Beta');
    expect(lines[5].text).toContain('└');
  });

  it('should render a formatted ASCII bar chart', () => {
    // Arrange
    const output = new TerminalOutput();
    const items = [
      { name: 'ProjA', seconds: 100, formattedDuration: '01:40' },
      { name: 'ProjB', seconds: 50, formattedDuration: '00:50' }
    ];

    // Act
    output.barChart(items, 10, 10);
    const lines = output.getLines();

    // Assert
    expect(lines).toHaveLength(2);
    expect(lines[0].text).toContain('ProjA');
    expect(lines[0].text).toContain('█');
    expect(lines[1].text).toContain('ProjB');
  });

  it('should merge lines into an external array', () => {
    // Arrange
    const output = new TerminalOutput();
    output.success('Ready');
    const target: TerminalLine[] = [];

    // Act
    output.mergeInto(target);

    // Assert
    expect(target).toHaveLength(1);
    expect(target[0]).toEqual({ text: 'Ready', type: 'success' });
  });
});
