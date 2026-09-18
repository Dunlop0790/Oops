import asyncio, math
from playwright.async_api import async_playwright
URL = 'file:///home/claude/deadlight/docs/index.html'
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errors = []
        async def new_page():
            ctx = await b.new_context(viewport={'width': 1000, 'height': 1000}, device_scale_factor=1.5)
            page = await ctx.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and '403' not in m.text else None)
            await page.goto(URL); await page.wait_for_timeout(400)
            return page
        # offline sanity
        page = await new_page()
        await page.click('#commander-list .commander-card >> nth=0 >> button'); await page.wait_for_timeout(1500)
        print('offline core label:', await page.evaluate("document.getElementById('hud-rival-label').textContent"))
        await page.keyboard.press('p'); await page.click('#abandon-button')
        # online: host + guest
        host = page; guest = await new_page()
        for pg, name in [(host, 'Corey'), (guest, 'Rival')]:
            await pg.click('.tab-button[data-tab="online"]')
            await pg.fill('#online-name', name); await pg.fill('#online-url', 'ws://127.0.0.1:8098')
        await host.click('#online-decks button >> nth=3')
        await host.click('#online-create-button'); await host.wait_for_timeout(600)
        status = await host.evaluate("document.getElementById('online-status').textContent")
        print('host status:', status)
        code = status.split('Room ')[1].split(':')[0]
        await guest.fill('#online-code', code); await guest.click('#online-join-button'); await guest.wait_for_timeout(1200)
        print('guest status:', await guest.evaluate("document.getElementById('online-status').textContent"))
        # guest (starboard) builds via ring and sends a pod
        box = await guest.locator('#game-canvas').bounding_box()
        sx = box['width']/960; sy = box['height']/624
        # starboard view is mirrored, so screen col c corresponds to world col 19-c; click screen tile (3,4) => world (16,4)
        def px(c, r): return (box['x'] + (c*48+24)*sx, box['y'] + (r*48+24)*sy)
        x, y = px(3, 4); await guest.mouse.click(x, y); await guest.wait_for_timeout(150)
        await guest.mouse.click(x + math.cos(-math.pi/2)*56*sx, y + math.sin(-math.pi/2)*56*sy)
        await guest.keyboard.press('q'); x, y = px(17, 0); await guest.mouse.click(x, y)  # screen (17,0) => world (2,0) top breach of port
        await guest.wait_for_timeout(4000)
        await guest.screenshot(path='/home/claude/deadlight/test/online_guest.png', clip={'x': box['x'], 'y': box['y'], 'width': box['width'], 'height': box['height']})
        hbox = await host.locator('#game-canvas').bounding_box()
        await host.screenshot(path='/home/claude/deadlight/test/online_host.png', clip={'x': hbox['x'], 'y': hbox['y'], 'width': hbox['width'], 'height': hbox['height']})
        print('host rival:', await host.evaluate("document.getElementById('hud-rival-label').textContent"), '| guest rival:', await guest.evaluate("document.getElementById('hud-rival-label').textContent"))
        print('host core:', await host.evaluate("document.getElementById('hud-core-you').textContent"), 'guest scrap:', await guest.evaluate("document.getElementById('hud-scrap').textContent"))
        print('errors:', errors)
        await b.close()
asyncio.run(run())
