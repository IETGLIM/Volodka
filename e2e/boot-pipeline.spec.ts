import { test, expect } from '@playwright/test';

test.describe('Boot pipeline', () => {
  test('shows progress, dismisses overlay, then menu', async ({ page }) => {
    await page.goto('/');

    const overlay = page.getByTestId('boot-loading-overlay');
    await expect(overlay).toBeVisible({ timeout: 15000 });

    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toBeVisible();

    await expect(page.getByText('Новая игра')).toBeVisible({ timeout: 45000 });
    await expect(overlay).toBeHidden({ timeout: 15000 });
    await expect(progressbar).toBeHidden({ timeout: 5000 });
  });

  test('simulated boot failure shows retry UI', async ({ page }) => {
    await page.goto('/?e2e_boot_fail=1');

    const bootError = page.getByTestId('boot-error');
    await expect(bootError).toBeVisible({ timeout: 10000 });
    await expect(bootError.getByRole('button', { name: 'Повторить' })).toBeVisible();
    await expect(bootError.getByText('E2E simulated boot failure')).toBeVisible();
  });

  test('boot error retry clears error state', async ({ page }) => {
    await page.goto('/?e2e_boot_fail=1');
    await expect(page.getByTestId('boot-error')).toBeVisible({ timeout: 10000 });

    await page.goto('/');
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('boot-error')).toBeHidden({ timeout: 5000 });
  });
});
