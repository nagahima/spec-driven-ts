import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { watchFaceRoute } from '../lib/api/apple-watch-ultra-face'

const app = new Hono().basePath('/api')
app.route('/watch-face', watchFaceRoute)

const post = (body: unknown) =>
  app.request('/api/watch-face', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const baseReq = {
  config: { background: 'painting' as const, timeMode: 'analog' as const },
  currentTime: '2026-04-25T10:30:00Z',
  batteryLevel: 0.5,
}

describe('POST /api/watch-face', () => {
  // AC-01: 背景テーマ4種から選択
  it.each(['painting', 'impressionist', 'monotone-mechanical', 'nature-pattern'] as const)(
    'AC-01: 背景テーマ %s を選択できる',
    async (background) => {
      const res = await post({ ...baseReq, config: { ...baseReq.config, background } })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.render.background).toBe(background)
    },
  )

  it('AC-01: 4種類以外の背景テーマは 400', async () => {
    const res = await post({ ...baseReq, config: { background: 'neon', timeMode: 'analog' } })
    expect(res.status).toBe(400)
  })

  // AC-02: 時刻モード analog/digital から選択
  it.each(['analog', 'digital'] as const)('AC-02: 時刻モード %s を選択できる', async (timeMode) => {
    const res = await post({ ...baseReq, config: { ...baseReq.config, timeMode } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.render.time.mode).toBe(timeMode)
  })

  it('AC-02: 未対応の時刻モードは 400', async () => {
    const res = await post({ ...baseReq, config: { background: 'painting', timeMode: 'binary' } })
    expect(res.status).toBe(400)
  })

  // AC-03: 選択モードで時・分が読み取れる、低コントラスト
  it('AC-03: アナログモードで時・分の角度を返し、opacityは低め', async () => {
    const res = await post({
      ...baseReq,
      config: { background: 'painting', timeMode: 'analog' },
      currentTime: '2026-04-25T03:30:00Z',
    })
    const body = await res.json()
    // 03:30 UTC → hour 3、minute 30 → hourAngle = 3*30 + 30*0.5 = 105、minuteAngle = 180
    expect(body.render.time.hourAngle).toBeCloseTo(105)
    expect(body.render.time.minuteAngle).toBeCloseTo(180)
    expect(body.render.time.opacity).toBeGreaterThan(0)
    expect(body.render.time.opacity).toBeLessThan(0.5)
  })

  it('AC-03: デジタルモードで HH:MM 形式を返す', async () => {
    const res = await post({
      ...baseReq,
      config: { background: 'painting', timeMode: 'digital' },
      currentTime: '2026-04-25T10:30:00Z',
    })
    const body = await res.json()
    expect(body.render.time.text).toBe('10:30')
    expect(body.render.time.opacity).toBeLessThan(0.5)
  })

  // AC-04: バッテリー残量が10%刻みで読み取れる(0-10ステップ)
  it('AC-04: バッテリー残量が10%刻み(0-10ステップ)で返る', async () => {
    const cases: Array<[number, number]> = [
      [0, 0],
      [0.04, 0],
      [0.05, 1], // 四捨五入境界
      [0.5, 5],
      [0.83, 8],
      [1, 10],
    ]
    for (const [level, expected] of cases) {
      const res = await post({ ...baseReq, batteryLevel: level })
      const body = await res.json()
      expect(body.render.battery.steps).toBe(expected)
      expect(body.render.battery.available).toBe(true)
    }
  })

  it('AC-04: バッテリー表示は数値テキストを含まない', async () => {
    const res = await post({ ...baseReq, batteryLevel: 0.5 })
    const body = await res.json()
    expect(body.render.battery).not.toHaveProperty('text')
    expect(body.render.battery).not.toHaveProperty('percent')
  })

  // AC-05: バッテリースタイルが背景テーマと調和し、目立たず溶け込む
  it('AC-05: 背景テーマごとにバッテリースタイルが対応し、opacityは低め', async () => {
    const expected: Array<[string, string]> = [
      ['painting', 'stroke'],
      ['impressionist', 'orb'],
      ['monotone-mechanical', 'arc'],
      ['nature-pattern', 'stroke'],
    ]
    for (const [bg, style] of expected) {
      const res = await post({
        ...baseReq,
        config: { background: bg as 'painting', timeMode: 'analog' },
      })
      const body = await res.json()
      expect(body.render.battery.style).toBe(style)
      expect(body.render.battery.opacity).toBeLessThan(0.5)
    }
  })

  // AC-06: バッテリー値が変わると表示が変わる(更新可能であること)
  it('AC-06: バッテリー値が変わると表示ステップが変わる', async () => {
    const r1 = await (await post({ ...baseReq, batteryLevel: 0.5 })).json()
    const r2 = await (await post({ ...baseReq, batteryLevel: 0.3 })).json()
    expect(r1.render.battery.steps).not.toBe(r2.render.battery.steps)
  })

  // AC-07: Always-On Display時にも読み取れる(opacityは更に低い)
  it('AC-07: Always-On時は通常時より低opacity、ただし時刻・バッテリーは読み取れる', async () => {
    const normal = await (await post({ ...baseReq, isAlwaysOn: false })).json()
    const aod = await (await post({ ...baseReq, isAlwaysOn: true })).json()

    expect(aod.render.isAlwaysOn).toBe(true)
    expect(aod.render.time.opacity).toBeLessThan(normal.render.time.opacity)
    expect(aod.render.battery.opacity).toBeLessThan(normal.render.battery.opacity)
    expect(aod.render.time.opacity).toBeGreaterThan(0)
    expect(aod.render.battery.opacity).toBeGreaterThan(0)
    expect(aod.render.battery.available).toBe(true)
    expect(aod.render.battery.steps).toBe(5)
  })

  // AC-E01: バッテリー情報が取得できないとき、空フォールバック (200)
  it('AC-E01: batteryLevel未指定で available=false / style=none のフォールバック (200)', async () => {
    const res = await post({
      config: { background: 'painting', timeMode: 'analog' },
      currentTime: '2026-04-25T10:30:00Z',
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.render.battery.available).toBe(false)
    expect(body.render.battery.style).toBe('none')
    expect(body.render.battery.opacity).toBe(0)
  })

  it('AC-E01: batteryLevel が null でも同様にフォールバック (200)', async () => {
    const res = await post({ ...baseReq, batteryLevel: null })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.render.battery.available).toBe(false)
  })

  // AC-E02: 描画中に例外発生 → デフォルトフォールバック (200, fallback=true)
  it('AC-E02: 不正な currentTime で fallback=true のデフォルト描画を返す (200)', async () => {
    const res = await post({ ...baseReq, currentTime: 'not-a-date' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.render.fallback).toBe(true)
    expect(body.render.time).toBeDefined()
  })
})
