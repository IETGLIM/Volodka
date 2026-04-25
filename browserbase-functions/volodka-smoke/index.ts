import { defineFn } from '@browserbasehq/sdk-functions';
import { chromium } from 'playwright-core';
import { z } from 'zod';

const paramsSchema = z.object({
  /** Public origin of the deployed app, e.g. https://volodka.vercel.app */
  baseUrl: z.string().min(1),
  /**
   * Полный путь: меню → «Новая игра» → «Пропустить» → ожидание WebGL на любом canvas (R3F).
   * На лоадере/меню первый canvas — 2D «матрица»; проверка `webgl` только на первом canvas всегда ложна.
   */
  deepBoot: z.boolean().optional().default(true),
});

/**
 * Cloud smoke test for the ВОЛОДЬКА Next.js + R3F app.
 *
 * Why Browserbase Functions here: production and preview URLs are only
 * reachable over the public internet; this runs a real Chromium session
 * in Browserbase (WebGL, fonts, TLS) — closer to users than Node-only checks.
 */
defineFn(
  'volodka-smoke',
  async (context, params) => {
    const parsed = paramsSchema.safeParse(params);
    if (!parsed.success) {
      return {
        ok: false,
        baseUrl: '',
        deepBoot: true,
        error:
          'Invalid params: pass { "baseUrl": "https://your-deployment", "deepBoot"?: true } — ' +
          parsed.error.message,
        httpStatus: 0,
        title: '',
        titleOk: false,
        canvasCount: 0,
        webglCanvasCount: 0,
        webglOk: false,
        steps: { menuClicked: false, introSkipped: false },
      };
    }

    const { baseUrl: rawBase, deepBoot } = parsed.data;
    const baseUrl = rawBase.replace(/\/$/, '');
    const { session } = context;

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const page = browser.contexts()[0]!.pages()[0]!;

    const steps = { menuClicked: false, introSkipped: false };

    try {
      const res = await page.goto(`${baseUrl}/`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      const status = res?.status() ?? 0;
      if (status >= 400) {
        return {
          ok: false,
          baseUrl,
          deepBoot,
          error: 'HTTP error',
          httpStatus: status,
          title: '',
          titleOk: false,
          canvasCount: 0,
          webglCanvasCount: 0,
          webglOk: false,
          steps,
        };
      }

      const title = await page.title();
      const titleOk = title.includes('ВОЛОДЬКА');

      if (!deepBoot) {
        const canvasCount = await page.locator('canvas').count();
        const webglCanvasCount = await page.evaluate(() => {
          let n = 0;
          for (const canvas of document.querySelectorAll('canvas')) {
            if (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) n++;
          }
          return n;
        });
        return {
          ok: titleOk && status < 400,
          baseUrl,
          deepBoot,
          error: '',
          httpStatus: status,
          title,
          titleOk,
          canvasCount,
          webglCanvasCount,
          webglOk: webglCanvasCount > 0,
          steps,
        };
      }

      await page.getByRole('button', { name: /Начать новую игру/i }).click({ timeout: 120_000 });
      steps.menuClicked = true;

      await page.getByRole('button', { name: /Пропустить/i }).click({ timeout: 45_000 });
      steps.introSkipped = true;

      await page.waitForFunction(
        () => {
          let n = 0;
          for (const canvas of document.querySelectorAll('canvas')) {
            if (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) n++;
          }
          return n >= 1;
        },
        { timeout: 180_000 },
      );

      const canvasCount = await page.locator('canvas').count();
      const webglCanvasCount = await page.evaluate(() => {
        let n = 0;
        for (const canvas of document.querySelectorAll('canvas')) {
          if (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) n++;
        }
        return n;
      });

      return {
        ok: titleOk && webglCanvasCount > 0,
        baseUrl,
        deepBoot,
        error: '',
        httpStatus: status,
        title,
        titleOk,
        canvasCount,
        webglCanvasCount,
        webglOk: webglCanvasCount > 0,
        steps,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const canvasCount = await page.locator('canvas').count().catch(() => 0);
      const webglCanvasCount = await page
        .evaluate(() => {
          let n = 0;
          for (const canvas of document.querySelectorAll('canvas')) {
            if (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) n++;
          }
          return n;
        })
        .catch(() => 0);
      return {
        ok: false,
        baseUrl,
        deepBoot,
        error: message,
        httpStatus: 0,
        title: await page.title().catch(() => ''),
        titleOk: false,
        canvasCount,
        webglCanvasCount,
        webglOk: false,
        steps,
      };
    }
  },
  { parametersSchema: paramsSchema },
);
