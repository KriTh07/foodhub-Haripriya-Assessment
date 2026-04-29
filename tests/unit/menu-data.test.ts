import { MENU_ITEMS, TAX_RATE, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/menu-data'

describe('MENU_ITEMS', () => {
  it('is a non-empty array', () => {
    expect(MENU_ITEMS.length).toBeGreaterThan(0)
  })

  it('each item has required fields', () => {
    MENU_ITEMS.forEach(item => {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.price).toBeGreaterThan(0)
      expect(['starters', 'mains', 'desserts', 'drinks']).toContain(item.category)
      expect(typeof item.available).toBe('boolean')
    })
  })

  it('has no duplicate IDs', () => {
    const ids = MENU_ITEMS.map(m => m.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('has items in all categories', () => {
    const categories = new Set(MENU_ITEMS.map(m => m.category))
    expect(categories.has('starters')).toBe(true)
    expect(categories.has('mains')).toBe(true)
    expect(categories.has('desserts')).toBe(true)
    expect(categories.has('drinks')).toBe(true)
  })

  it('has at least one available item per category', () => {
    const available = MENU_ITEMS.filter(m => m.available)
    const availCats = new Set(available.map(m => m.category))
    expect(availCats.has('starters')).toBe(true)
    expect(availCats.has('mains')).toBe(true)
  })
})

describe('constants', () => {
  it('TAX_RATE is between 0 and 1', () => {
    expect(TAX_RATE).toBeGreaterThan(0)
    expect(TAX_RATE).toBeLessThan(1)
  })

  it('DELIVERY_FEE is positive', () => {
    expect(DELIVERY_FEE).toBeGreaterThan(0)
  })

  it('FREE_DELIVERY_THRESHOLD is positive', () => {
    expect(FREE_DELIVERY_THRESHOLD).toBeGreaterThan(0)
  })
})