import asyncio
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
            await page.goto(URL); await page.wait_for_timeout(400)
            await page.click('.tab-button[data-tab="online"]')
            return page
        host = await new_page(); guest = await new_page()
        await host.fill('#online-name', 'Corey'); await host.fill('#online-url', 'ws://127.0.0.1:8098')
        await guest.fill('#online-name', 'Rival'); await guest.fill('#online-url', 'ws://127.0.0.1:8098')
        await host.click('#online-create-button'); await host.wait_for_timeout(500)
        code = await host.evaluate("document.getElementById('room-code').textContent")
        print('room', code, '| host status:', await host.evaluate("document.getElementById('room-status').textContent"))
        await guest.fill('#online-code', code); await guest.click('#online-join-button'); await guest.wait_for_timeout(500)
        # host picks deck (guest buttons disabled)
        await host.click('#room-decks button >> nth=4'); await host.wait_for_timeout(300)
        print('guest sees deck:', await guest.evaluate("[...document.querySelectorAll('#room-decks button')].find(b => b.classList.contains('is-active')).textContent"), '| guest deck disabled:', await guest.evaluate("document.querySelector('#room-decks button').disabled"))
        await host.screenshot(path='test/room_lobby.png')
        await host.click('#room-ready-button'); await host.wait_for_timeout(300)
        print('host ready state:', await guest.evaluate("document.querySelectorAll('.room-seat')[0].textContent"))
        await guest.click('#room-ready-button'); await guest.wait_for_timeout(800)
        print('host rival:', await host.evaluate("document.getElementById('hud-rival-label').textContent"), '| in match overlay hidden:', await host.evaluate("document.getElementById('menu-overlay').classList.contains('is-hidden')"))
        # force an end: guest leaves mid-match -> host wins, room persists for host
        await guest.wait_for_timeout(1500)
        await guest.evaluate("document.getElementById('pause-button').disabled")
        # end via server: simulate guest leaving by closing the guest page context (disconnect -> 45s grace). Instead use leave from end? Use abandon: host presses abandon -> should NOT kick; use guest leave via room? Skip: wait then check end overlay after host abandons.
        await host.keyboard.press('p')  # disabled online
        await host.click('#abandon-button') if await host.evaluate("!document.getElementById('pause-overlay').classList.contains('is-hidden')") else None
        await host.wait_for_timeout(300)
        print('errors:', errors)
        await b.close()
asyncio.run(run())
