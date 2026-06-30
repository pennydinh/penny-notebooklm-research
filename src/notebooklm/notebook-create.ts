/**
 * Create a brand-new NotebookLM notebook from the home page.
 *
 * The research workflow needs ONE notebook per topic — mixing topics in a
 * single notebook makes Gemini's analysis bleed across subjects. Rather than
 * asking the user to create + share a notebook by hand for every run, this
 * drives the "Create new" button on the NotebookLM home and returns the URL
 * of the freshly-created notebook so `add_source` / `ask_question` can target
 * it immediately.
 *
 * Page contract: the caller passes a page already authenticated against
 * Google; this function navigates it to the home, clicks create, and waits
 * for the resulting `/notebook/<uuid>` URL.
 */

import type { Page } from "patchright";
import { log } from "../utils/logger.js";

const HOME_URL = "https://notebooklm.google.com/";

/** "Create new" button — brand text ("Tạo mới"/"Create new") plus class anchors. */
const CREATE_BUTTON = [
  'button:has-text("Tạo mới")',
  'button:has-text("Create new")',
  'button:has-text("Criar")',
  'button:has-text("Nouveau")',
  'button:has-text("Crear")',
  'button:has-text("Erstellen")',
  'button:has-text("新規作成")',
  'button[aria-label*="create" i]',
  'button.create-new-button',
  // Last resort: the "+" new-notebook card on the home grid.
  'button:has-text("Tạo sổ ghi chú mới")',
  'button:has-text("Create new notebook")',
];

export interface CreateNotebookResult {
  url: string;
  id: string;
}

export async function createNotebook(page: Page): Promise<CreateNotebookResult> {
  log.info("📓 [create_notebook] opening NotebookLM home");
  await page.goto(HOME_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(5_000);

  let clicked = false;
  for (const sel of CREATE_BUTTON) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2_500 }).catch(() => false)) {
      await btn.click();
      log.info(`  ✅ clicked create (selector: ${sel})`);
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    throw new Error(
      'Could not find the "Create new" button on the NotebookLM home page. ' +
        "The UI may have changed, or the page did not load."
    );
  }

  // Clicking create navigates to a fresh /notebook/<uuid> (it also auto-opens
  // the Add-source dialog, which add_source will reuse).
  await page.waitForFunction(() => /\/notebook\/[a-f0-9-]{8,}/i.test(location.href), null, {
    timeout: 25_000,
  });
  await page.waitForTimeout(2_500);

  const url = page.url().split("?")[0];
  const id = url.match(/notebook\/([a-f0-9-]+)/i)?.[1];
  if (!id) {
    throw new Error(`Notebook created but its URL looks unexpected: ${url}`);
  }
  log.success(`  ✅ new notebook: ${url}`);
  return { url, id };
}
