import { test, expect } from '@playwright/test';

test.describe('Naval AAW Tactical Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page without errors', async ({ page }) => {
    const title = await page.title();
    expect(title).toBe('Naval AAW Tactical Display');
  });

  test('should display sidebar with scenario title', async ({ page }) => {
    const header = page.locator('#sidebar-header h1');
    await expect(header).toContainText('Taiwan Strait Scenario');
  });

  test('should have 2D and 3D view buttons', async ({ page }) => {
    const btn2D = page.locator('#btn-view-2d');
    const btn3D = page.locator('#btn-view-3d');
    
    await expect(btn2D).toBeVisible();
    await expect(btn3D).toBeVisible();
    await expect(btn2D).toHaveClass(/active/);
  });

  test('should have projection selector', async ({ page }) => {
    const select = page.locator('#projection-select');
    await expect(select).toBeVisible();
    
    const options = await select.locator('option').all();
    expect(options).toHaveLength(3);
  });

  test('should have timeline controls', async ({ page }) => {
    const btnPlay = page.locator('#btn-play');
    const btnReset = page.locator('#btn-reset');
    const display = page.locator('#timeline-display');
    
    await expect(btnPlay).toBeVisible();
    await expect(btnReset).toBeVisible();
    await expect(display).toContainText('00:00');
  });

  test('should have aircraft controls', async ({ page }) => {
    const count = page.locator('#aircraft-count');
    const limit = page.locSelector('#aircraft-limit');
    
    await expect(count).toBeVisible();
    await expect(limit).toBeVisible();
  });

  test('should have diagnostics button', async ({ page }) => {
    const btn = page.locator('#btn-diagnostics');
    await expect(btn).toBeVisible();
  });

  test('should have coordinate readout', async ({ page }) => {
    const readout = page.locator('#coordinate-readout');
    await expect(readout).toBeVisible();
  });

  test('should have map container', async ({ page }) => {
    const map2d = page.locator('#map2d');
    const map3d = page.locator('#map3d');
    
    await expect(map2d).toBeVisible();
    await expect(map3d).toBeHidden();
  });

  test('should toggle between 2D and 3D views', async ({ page }) => {
    const btn3D = page.locator('#btn-view-3d');
    const map2d = page.locator('#map2d');
    const map3d = page.locator('#map3d');
    
    await btn3D.click();
    await page.waitForTimeout(500);
    
    await expect(map2d).toBeHidden();
    await expect(map3d).toHaveClass(/active/);
  });

  test('should switch projection', async ({ page }) => {
    const select = page.locator('#projection-select');
    
    await select.selectOption('EPSG:4326');
    await page.waitForTimeout(500);
    
    await select.selectOption('EPSG:3857');
    await page.waitForTimeout(500);
  });

  test('should play/pause animation', async ({ page }) => {
    const btnPlay = page.locator('#btn-play');
    
    await btnPlay.click();
    await expect(btnPlay).toContainText('Pause');
    
    await btnPlay.click();
    await expect(btnPlay).toContainText('Play');
  });

  test('should reset timeline', async ({ page }) => {
    const btnPlay = page.locator('#btn-play');
    const btnReset = page.locator('#btn-reset');
    const display = page.locator('#timeline-display');
    
    await btnPlay.click();
    await page.waitForTimeout(1000);
    
    await btnReset.click();
    await expect(display).toContainText('00:00');
  });

  test('should toggle diagnostics', async ({ page }) => {
    const btn = page.locator('#btn-diagnostics');
    
    await btn.click();
    await expect(btn).toHaveClass(/active/);
    
    await btn.click();
    await expect(btn).not.toHaveClass(/active/);
  });

  test('should display track list in sidebar', async ({ page }) => {
    const trackList = page.locator('#track-list');
    const tracks = trackList.locator('.track-item');
    
    await expect(tracks).toHaveCount(6);
  });

  test('should select a track from sidebar', async ({ page }) => {
    const firstTrack = page.locator('#track-list .track-item').first();
    await firstTrack.click();
    
    await expect(firstTrack).toHaveClass(/selected/);
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && !e.includes('deprecated')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});