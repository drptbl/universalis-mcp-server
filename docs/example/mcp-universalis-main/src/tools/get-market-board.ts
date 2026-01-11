import axios from 'axios'
import { z } from 'zod'

const listings = 2
const entries = 2
const hqMap = [true, false] as const
const fields = [
  'minPriceNQ',
  'minPriceHQ',
  'listings.pricePerUnit',
  'listings.quantity',
  'listings.hq',
  'recentHistory.pricePerUnit',
  'recentHistory.quantity',
  'recentHistory.hq',
].join(',')

const universalisResponseSchema = z.object({
  minPriceNQ: z.number(),
  minPriceHQ: z.number(),
  listings: z.array(z.object({ pricePerUnit: z.number(), quantity: z.number(), hq: z.boolean() })),
  recentHistory: z.array(z.object({ pricePerUnit: z.number(), quantity: z.number(), hq: z.boolean() })),
})

let items: Record<string, { id: number; name: string }> = {}

export async function getMarketBoard(itemName: string, serverNames: string[]) {
  if (Object.keys(items).length === 0) {
    items = await axios
      .get('https://cdn.jsdelivr.net/gh/Universalis-FFXIV/mogboard-next@main/data/game/ko/items.json')
      .then((res) => res.data as Record<string, { id: number; name: string }>)
  }

  const matchedItems = Object.values(items)
    .filter((item) => item.name.includes(itemName))
    .slice(0, 5)

  return await Promise.all(
    serverNames.flatMap((serverName) =>
      matchedItems.map(async (item) => {
        const [nq, hq] = await Promise.all(
          hqMap.map(async (hq) => {
            const res = await axios.get(`https://universalis.app/api/v2/${serverName}/${item.id}`, {
              params: { entries, listings, hq, fields },
            })
            return universalisResponseSchema.parse(res.data)
          }),
        )
        const summary: z.infer<typeof universalisResponseSchema> = {
          minPriceNQ: nq.minPriceNQ,
          minPriceHQ: hq.minPriceHQ,
          listings: [...nq.listings, ...hq.listings],
          recentHistory: [...nq.recentHistory, ...hq.recentHistory],
        }
        return { serverName, itemName: item.name, ...summary }
      }),
    ),
  )
}
