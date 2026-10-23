import { SUMMARY_MARKER } from '../constants.js';
import { formatPct, getExecutionStatusBadge, getStatusBadge } from './badge-formatter.js';
import { MarkdownTableFormatter } from './markdown-table-formatter.js';

export { formatPct, getExecutionStatusBadge, getStatusBadge };

/**
 * Extracts line coverage percentage from coverage summary or layer report.
 *
 * @param {import('../types.js').CoverageSummary | { linesPct?: number } | null | undefined} data
 * @returns {number | null} Percentage value or null.
 */
function extractLinesPct(data) {
  if (!data) return null;
  if ('linesPct' in data && typeof data.linesPct === 'number') {
    return data.linesPct;
  }
  if ('lines' in data && data.lines && typeof data.lines.pct === 'number') {
    return data.lines.pct;
  }
  return null;
}

/**
 * Builder for assembling CI test execution and code coverage reports.
 */
export class MarkdownSummaryBuilder {
  constructor() {
    /** @type {import('../types.js').TestExecutionSummary | null} */
    this.testResults = null;
    /** @type {import('../types.js').LayerCoverageReport | null} */
    this.frontendCov = null;
    /** @type {import('../types.js').LayerCoverageReport | null} */
    this.rustCov = null;
    /** @type {Date} */
    this.timestamp = new Date();
  }

  /**
   * Sets test execution results.
   *
   * @param {import('../types.js').TestExecutionSummary | null} testResults
   * @returns {this}
   */
  withTestResults(testResults) {
    this.testResults = testResults;
    return this;
  }

  /**
   * Sets frontend coverage report.
   *
   * @param {import('../types.js').LayerCoverageReport | null} frontendCov
   * @returns {this}
   */
  withFrontendCoverage(frontendCov) {
    this.frontendCov = frontendCov;
    return this;
  }

  /**
   * Sets Rust backend coverage report.
   *
   * @param {import('../types.js').LayerCoverageReport | null} rustCov
   * @returns {this}
   */
  withRustCoverage(rustCov) {
    this.rustCov = rustCov;
    return this;
  }

  /**
   * Sets report timestamp.
   *
   * @param {Date | string | number} timestamp
   * @returns {this}
   */
  withTimestamp(timestamp) {
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return this;
  }

  /**
   * Appends execution table row with test counts and duration.
   *
   * @param {MarkdownTableFormatter} table
   * @param {string} title
   * @param {import('../types.js').SuiteTestSummary} suite
   */
  #appendExecutionRow(table, title, suite) {
    const status = getExecutionStatusBadge(suite.failed, suite.total);
    const duration = suite.durationMs !== undefined ? `${(suite.durationMs / 1000).toFixed(2)}s ⏱️` : '—';
    const failedText = suite.failed > 0 ? `\`${suite.failed}\` ❌` : `\`${suite.failed}\``;

    table.addRow([
      title,
      `**${status}**`,
      `\`${suite.passed}\` ✅`,
      failedText,
      `\`${suite.skipped}\` ⚠️`,
      `\`${suite.total}\``,
      `\`${duration}\``
    ]);
  }

  /**
   * Renders the execution section including multi-tier tables.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderExecutionSection(parts) {
    if (!this.testResults) return;

    parts.push('### 📋 Test Execution');
    parts.push('');

    const hasMultiTier = Boolean(this.testResults.frontend || this.testResults.backend);

    if (hasMultiTier) {
      if (this.testResults.frontend) {
        parts.push('#### 🌐 Frontend Tests');
        const ft = new MarkdownTableFormatter(
          ['Suite / Tier', 'Status', 'Passed', 'Failed', 'Skipped', 'Total Tests', 'Duration'],
          [':---', ':---:', ':---:', ':---:', ':---:', ':---:', ':---:']
        );
        const fe = this.testResults.frontend;
        if (fe.all) this.#appendExecutionRow(ft, '**All Frontend**', fe.all);
        if (fe.unit) this.#appendExecutionRow(ft, '&nbsp;&nbsp;↳ Unit Tests', fe.unit);
        if (fe.integration) this.#appendExecutionRow(ft, '&nbsp;&nbsp;↳ Integration Tests', fe.integration);
        parts.push(ft.render());
        parts.push('');
      }

      if (this.testResults.backend) {
        parts.push('#### 🦀 Backend Tests (Rust Engine)');
        const bt = new MarkdownTableFormatter(
          ['Suite / Tier', 'Status', 'Passed', 'Failed', 'Skipped', 'Total Tests', 'Duration'],
          [':---', ':---:', ':---:', ':---:', ':---:', ':---:', ':---:']
        );
        const be = this.testResults.backend;
        if (be.all) this.#appendExecutionRow(bt, '**All Backend**', be.all);
        if (be.unit) this.#appendExecutionRow(bt, '&nbsp;&nbsp;↳ Unit Tests', be.unit);
        if (be.integration) this.#appendExecutionRow(bt, '&nbsp;&nbsp;↳ Integration Tests', be.integration);
        parts.push(bt.render());
        parts.push('');
      }
    } else {
      const table = new MarkdownTableFormatter(
        ['Status', 'Passed', 'Failed', 'Skipped', 'Total Tests', 'Duration'],
        [':---:', ':---:', ':---:', ':---:', ':---:', ':---:']
      );
      const durationSec = (this.testResults.durationMs / 1000).toFixed(2);
      const status = getExecutionStatusBadge(this.testResults.failed, this.testResults.total);
      const failedText = this.testResults.failed > 0 ? `\`${this.testResults.failed}\` ❌` : `\`${this.testResults.failed}\``;

      table.addRow([
        `**${status}**`,
        `\`${this.testResults.passed}\` ✅`,
        failedText,
        `\`${this.testResults.skipped}\` ⚠️`,
        `\`${this.testResults.total}\``,
        `\`${durationSec}s\` ⏱️`
      ]);
      parts.push(table.render());
      parts.push('');
    }
  }

  /**
   * Renders the failed tests section with collapsible details.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderFailuresSection(parts) {
    if (!this.testResults?.failures || this.testResults.failures.length === 0) return;

    parts.push(`### ❌ Failed Tests (${this.testResults.failures.length})`);
    for (const fail of this.testResults.failures) {
      parts.push('<details open>');
      parts.push(`<summary><b><code>${fail.file}</code> &gt; ${fail.title}</b></summary>`);
      parts.push('');
      parts.push('```text');
      parts.push(fail.message.trim() || 'No additional error details recorded.');
      parts.push('```');
      parts.push('</details>');
      parts.push('');
    }
  }

  /**
   * Appends a 4-dimension coverage row to the table.
   *
   * @param {MarkdownTableFormatter} table
   * @param {string} label
   * @param {import('../types.js').CoverageSummary} summary
   */
  #appendCoverageSummaryRow(table, label, summary) {
    const l = summary.lines?.pct;
    const s = summary.statements?.pct;
    const b = summary.branches?.pct;
    const f = summary.functions?.pct;

    table.addRow([label, formatPct(l), formatPct(s), formatPct(b), formatPct(f), getStatusBadge(l)]);
  }

  /**
   * Renders the frontend coverage table and collapsible breakdown.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderFrontendCoverage(parts) {
    if (!this.frontendCov) return;

    parts.push('#### 🌐 Frontend Code Coverage');
    const table = new MarkdownTableFormatter(
      ['Scope / Tier', 'Lines', 'Statements', 'Branches', 'Functions', 'Status'],
      [':---', ':---:', ':---:', ':---:', ':---:', ':---:']
    );

    const allSummary = this.frontendCov.all || this.frontendCov.total;
    if (allSummary) {
      this.#appendCoverageSummaryRow(table, '**All Frontend**', allSummary);
    }

    if (this.frontendCov.unit && 'lines' in this.frontendCov.unit) {
      this.#appendCoverageSummaryRow(table, '&nbsp;&nbsp;↳ Unit Tests', this.frontendCov.unit);
    }

    if (this.frontendCov.integration && 'lines' in this.frontendCov.integration) {
      this.#appendCoverageSummaryRow(table, '&nbsp;&nbsp;↳ Integration Tests', this.frontendCov.integration);
    }

    parts.push(table.render());
    parts.push('');

    if (this.frontendCov.breakdown && this.frontendCov.breakdown.length > 0) {
      parts.push('<details>');
      parts.push('<summary>🔍 <b>Expand for Frontend Module Breakdown</b></summary>');
      parts.push('');
      const detailTable = new MarkdownTableFormatter(
        ['Module / Directory', 'Lines', 'Statements', 'Branches', 'Functions', 'Status'],
        [':---', ':---:', ':---:', ':---:', ':---:', ':---:']
      );
      for (const sub of this.frontendCov.breakdown) {
        detailTable.addRow([
          `\`${sub.name}\``,
          formatPct(sub.lines),
          formatPct(sub.statements),
          formatPct(sub.branches),
          formatPct(sub.functions),
          getStatusBadge(sub.lines)
        ]);
      }
      parts.push(detailTable.render());
      parts.push('</details>');
      parts.push('');
    }
  }

  /**
   * Renders the Rust backend coverage table and collapsible breakdown.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderRustCoverage(parts) {
    if (!this.rustCov) return;

    parts.push('#### 🦀 Backend Code Coverage (Rust Engine)');
    const table = new MarkdownTableFormatter(
      ['Scope / Tier', 'Lines', 'Statements', 'Branches', 'Functions', 'Status'],
      [':---', ':---:', ':---:', ':---:', ':---:', ':---:']
    );

    const allPct = extractLinesPct(this.rustCov.all) ?? this.rustCov.linesPct;
    table.addRow(['**All Backend**', formatPct(allPct), formatPct(allPct), '—', '—', getStatusBadge(allPct)]);

    if (this.rustCov.unit) {
      const uPct = extractLinesPct(this.rustCov.unit);
      table.addRow(['&nbsp;&nbsp;↳ Unit Tests', formatPct(uPct), formatPct(uPct), '—', '—', getStatusBadge(uPct)]);
    }

    if (this.rustCov.integration) {
      const iPct = extractLinesPct(this.rustCov.integration);
      table.addRow(['&nbsp;&nbsp;↳ Integration Tests', formatPct(iPct), formatPct(iPct), '—', '—', getStatusBadge(iPct)]);
    }

    parts.push(table.render());
    parts.push('');

    if (this.rustCov.breakdown && this.rustCov.breakdown.length > 0) {
      parts.push('<details>');
      parts.push('<summary>🔍 <b>Expand for Backend Module Breakdown</b></summary>');
      parts.push('');
      const detailTable = new MarkdownTableFormatter(
        ['Module / Directory', 'Lines', 'Statements', 'Branches', 'Functions', 'Status'],
        [':---', ':---:', ':---:', ':---:', ':---:', ':---:']
      );
      for (const sub of this.rustCov.breakdown) {
        detailTable.addRow([
          `\`${sub.name}\``,
          formatPct(sub.lines),
          formatPct(sub.lines),
          '—',
          '—',
          getStatusBadge(sub.lines)
        ]);
      }
      parts.push(detailTable.render());
      parts.push('</details>');
      parts.push('');
    }
  }

  /**
   * Renders the combined full-stack summary row if both layers exist.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderCombinedCoverage(parts) {
    const fLines = extractLinesPct(this.frontendCov?.all || this.frontendCov?.total);
    const rLines = extractLinesPct(this.rustCov?.all) ?? this.rustCov?.linesPct;

    if (fLines === null || rLines === null || fLines === undefined || rLines === undefined) return;

    const avg = (fLines + rLines) / 2;
    parts.push('#### 📈 Combined Full-Stack Coverage');
    const table = new MarkdownTableFormatter(['Project Scope', 'Lines', 'Status'], [':---', ':---:', ':---:']);
    table.addRow(['**Full Stack (Frontend + Backend Engine)**', formatPct(avg), getStatusBadge(avg)]);
    parts.push(table.render());
    parts.push('');
  }

  /**
   * Renders the complete coverage metrics section.
   *
   * @param {string[]} parts Output string buffer.
   */
  #renderCoverageSection(parts) {
    parts.push('### 📊 Code Coverage Metrics');
    parts.push('');

    if (!this.frontendCov && !this.rustCov) {
      parts.push('*No coverage reports detected in current artifacts.*');
      parts.push('');
      return;
    }

    this.#renderFrontendCoverage(parts);
    this.#renderRustCoverage(parts);
    this.#renderCombinedCoverage(parts);
  }

  /**
   * Builds the formatted markdown summary string.
   *
   * @returns {string} Complete Markdown document.
   */
  build() {
    const parts = [];

    parts.push(SUMMARY_MARKER);
    parts.push('## 🧪 Test & Code Coverage Summary');
    parts.push('');

    this.#renderExecutionSection(parts);
    this.#renderFailuresSection(parts);
    this.#renderCoverageSection(parts);

    parts.push(`*Generated at ${this.timestamp.toISOString()} by oXyFlow CI Pipeline.*`);

    return parts.join('\n');
  }
}

/**
 * Builds the test results and code coverage Markdown report via MarkdownSummaryBuilder.
 *
 * @param {import('../types.js').TestExecutionSummary} testResults Test summary data.
 * @param {import('../types.js').LayerCoverageReport | null} frontendCov Frontend coverage data.
 * @param {import('../types.js').LayerCoverageReport | null} rustCov Rust coverage data.
 * @param {Date} [timestamp=new Date()] Report generation timestamp.
 * @returns {string} Complete markdown report.
 */
export function buildMarkdownSummary(testResults, frontendCov, rustCov, timestamp = new Date()) {
  return new MarkdownSummaryBuilder()
    .withTestResults(testResults)
    .withFrontendCoverage(frontendCov)
    .withRustCoverage(rustCov)
    .withTimestamp(timestamp)
    .build();
}
