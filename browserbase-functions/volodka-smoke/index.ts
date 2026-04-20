import { defineFn } from '@browserbasehq/sdk-functions';
import { chromium } from 'playwright-core';
import { z } from 'zod';

const paramsSchema = z.object({
  /** Public origin of the deployed app, e.g. https://volodka.vercel.app */
  baseUrl: z.string().min(1),
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
        error:
          'Invalid params: pass { "baseUrl": "https://your-deployment" } — ' +
          parsed.error.message,
        httpStatus: 0,
        title: '',
        titleOk: false,
        canvasCount: 0,
        webglOk: false,
      };
    }

    const baseUrl = parsed.data.baseUrl.replace(/\/$/, '');
    const { session } = context;

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const page = browser.contexts()[0]!.pages()[0]!;

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
          error: 'HTTP error',
          httpStatus: status,
          title: '',
          titleOk: false,
          canvasCount: 0,
          webglOk: false,
        };
      }

      const title = await page.title();
      const titleOk = title.includes('ВОЛОДЬКА');

      await page.waitForSelector('canvas', { timeout: 90_000 });
      const canvasCount = await page.locator('canvas').count();

      const webglOk = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        const gl =
          canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        return !!gl;
      });

      return {
        ok: titleOk && canvasCount > 0 && webglOk,
        baseUrl,
        error: '',
        httpStatus: status,
        title,
        titleOk,
        canvasCount,
        webglOk,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        baseUrl,
        error: message,
        httpStatus: 0,
        title: '',
        titleOk: false,
        canvasCount: 0,
        webglOk: false,
      };
    }
  },
  { parametersSchema: paramsSchema },
);
