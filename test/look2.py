import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/deadlight/docs/index.html'
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1000, 'height': 760}, device_scale_factor=1.5)
        page = await ctx.new_page()
        await page.goto(URL); await page.wait_for_timeout(500)
        await page.click('#commander-list .commander-card >> nth=0 >> button'); await page.wait_for_timeout(200)
        await page.keyboard.press('q'); box = await page.locator('#game-canvas').bounding_box()
        await page.mouse.click(box['x'] + (14*48+24)*box['width']/960, box['y'] + 24*box['height']/624)
        await page.keyboard.press('f'); await page.wait_for_timeout(4000); await page.keyboard.press('f')
        await page.keyboard.press('p'); await page.wait_for_timeout(100)
        await page.screenshot(path='test/look2_hud.png', clip={'x': 0, 'y': 0, 'width': 1000, 'height': 90})
        await page.click('#resume-button'); await page.keyboard.press('p'); await page.click('#abandon-button'); await page.wait_for_timeout(200)
        await page.click('.tab-button[data-tab="briefing"]'); await page.wait_for_timeout(200)
        await page.screenshot(path='test/look2_briefing.png')
        await b.close()
asyncio.run(run())
