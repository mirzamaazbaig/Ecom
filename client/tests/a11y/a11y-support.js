import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

/** WCAG 2.1 levels A and AA, the usual conformance target. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** One readable line per violation: rule, impact, how many elements, and the first selectors. */
function describe(violation) {
    const targets = violation.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ');
    return `${violation.id} [${violation.impact}] x${violation.nodes.length}: ${violation.help} (${targets})`;
}

/**
 * Run axe-core on the current page and fail with the list of violations.
 * `exclude` is for third-party widgets we do not own; it is empty for the pages tested here.
 */
export async function expectNoA11yViolations(page, { exclude = [] } = {}) {
    // Pages fade in over 0.7 s; scanning mid-animation measures contrast on half-transparent text and
    // reports violations that are not there once the page is settled.
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'));

    let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
    for (const selector of exclude) {
        builder = builder.exclude(selector);
    }
    const { violations } = await builder.analyze();
    expect(violations.map(describe), `accessibility violations on ${page.url()}`).toEqual([]);
}
