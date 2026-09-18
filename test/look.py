import asyncio, math
from playwright.async_api import async_playwright
URL = 'file:///home/claude/deadlight/docs/index.html'
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1000, 'height': 1000}, device_scale_factor=1.5)
        page = await ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(URL); await page.wait_for_timeout(600)
        await page.screenshot(path='test/look_menu.png')
        await page.click('#commander-list .commander-card >> nth=0 >> button'); await page.wait_for_timeout(300)
        box = await page.locator('#game-canvas').bounding_box()
        sx = box['width']/960; sy = box['height']/624
        def px(c, r): return (box['x'] + (c*48+24)*sx, box['y'] + (r*48+24)*sy)
        x, y = px(3, 4); await page.mouse.click(x, y); await page.wait_for_timeout(100); await page.mouse.click(x, y - 56*sy)
        await page.keyboard.press('q'); x, y = px(14, 0); await page.mouse.click(x, y)
        await page.keyboard.press('f'); await page.wait_for_timeout(6000); await page.keyboard.press('f')
        x, y = px(6, 5); await page.mouse.click(x, y); await page.mouse.move(x + math.cos(-math.pi/2 + 2*math.pi/5)*56*sx, y + math.sin(-math.pi/2 + 2*math.pi/5)*56*sy); await page.wait_for_timeout(300)
        await page.screenshot(path='test/look_play.png')
        print('errors:', errors)
        await b.close()
asyncio.run(run())
