import { NextResponse } from 'next/server'
import { MENU_ITEMS } from '@/lib/menu-data'
import { menuLogger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const availableOnly = searchParams.get('available') === 'true'

  menuLogger.debug({ category, availableOnly }, 'GET /api/menu')

  let items = MENU_ITEMS
  if (category) items = items.filter(i => i.category === category)
  if (availableOnly) items = items.filter(i => i.available)

  menuLogger.info({ total: items.length, category, availableOnly }, 'menu items returned')
  return NextResponse.json({ items, total: items.length })
}
