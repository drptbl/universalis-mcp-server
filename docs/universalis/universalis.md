

API Version
v2

Universalis REST API
Welcome to the Universalis documentation page.
There is a rate limit of 25 req/s (50 req/s burst) on the API, and 15 req/s (30 req/s burst) on the website itself, if you're scraping instead. The number of simultaneous connections per IP is capped to 8.
To map item IDs to item names or vice versa, use XIVAPI. In addition to XIVAPI, you can also get item ID mappings from Lumina, this sheet, or this pre-made dump.
To get a mapping of world IDs to world names, use XIVAPI or this sheet. The key column represents the world ID, and the Name column represents the world name. Note that not all listed worlds are available to be used — many of the worlds in this sheet are test worlds, or Korean worlds (Korea is unsupported at this time).
If you use this API heavily for your projects, please consider supporting the website on Liberapay, Ko-fi, or Patreon, or making a one-time donation on Ko-fi. Any support is appreciated!
Table of contents
Endpoints
Available data centers
Available worlds
Current item price
Game entities
Least-recently updated items
Market board current data
Market board sale history
Market tax rates
Marketable items
Most-recently updated items
Recently updated items
Upload counts by upload application
Upload counts by world
Uploads per day
User lists
Entities
Microsoft.AspNetCore.Mvc.ProblemDetails
Universalis.Application.Views.V1.CurrentlyShownView
Universalis.Application.Views.V1.Extra.ContentView
Universalis.Application.Views.V1.Extra.Stats.MostRecentlyUpdatedItemsView
Universalis.Application.Views.V1.Extra.Stats.RecentlyUpdatedItemsView
Universalis.Application.Views.V1.Extra.Stats.SourceUploadCountView
Universalis.Application.Views.V1.Extra.Stats.UploadCountHistoryView
Universalis.Application.Views.V1.Extra.Stats.WorldItemRecencyView
Universalis.Application.Views.V1.Extra.Stats.WorldUploadCountView
Universalis.Application.Views.V1.HistoryView
Universalis.Application.Views.V1.ListingView
Universalis.Application.Views.V1.MateriaView
Universalis.Application.Views.V1.MinimizedSaleView
Universalis.Application.Views.V1.SaleView
Universalis.Application.Views.V1.TaxRatesView
Universalis.Application.Views.V2.AggregatedMarketBoardData
Universalis.Application.Views.V2.AggregatedMarketBoardData+AggregatedResult
Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice
Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry
Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity
Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry
Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing
Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry
Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing
Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry
Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase
Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry
Universalis.Application.Views.V2.AggregatedMarketBoardData+Result
Universalis.Application.Views.V2.AggregatedMarketBoardData+WorldUploadTime
Universalis.Application.Views.V2.CurrentlyShownMultiViewV2
Universalis.Application.Views.V2.HistoryMultiViewV2
Universalis.Application.Views.V2.UserListView
Universalis.Application.Views.V3.Game.DataCenter
Universalis.Application.Views.V3.Game.World
Endpoints
Available data centers
get - /api/v2/data-centers
Returns all data centers supported by the API.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/data-centers
Available worlds
get - /api/v2/worlds
Returns the IDs and names of all worlds supported by the API.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/worlds
Current item price
get - /api/v2/aggregated/{worldDcRegion}/{itemIds}
Retrieves aggregated market board data for the given items. Up to 100 item IDs can be comma-separated in order to retrieve data for multiple items at once. AverageSalePrice and DailySaleVelocity are calculated based on sales of the last 4 days. This API uses only cached values and is therefore strongly preferred over CurrentlyShown if individual sales/listings are not required.
Responses
Code	Description
200	Data retrieved successfully.
400	The parameters were invalid.
404	The world/DC or item requested is invalid. When requesting multiple items at once, an invalid item ID will not trigger this. Instead, the returned list of unresolved item IDs will contain the invalid item ID or IDs.
itemIds *
string (path) The item ID or comma-separated item IDs to retrieve data for.
worldDcRegion *
string (path) The world, data center, or region to retrieve data for. This may be an ID or a name. Regions should be specified as Japan, Europe, North-America, Oceania, China, or 中国.
User-Agent
string (header)
CF-Connecting-IP
string (header)
https://universalis.app/api/v2/aggregated//
Game entities
get - /api/v2/extra/content/{contentId}
Returns the content object associated with the provided content ID. Please note that this endpoint is largely untested, and may return inconsistent data at times.
Responses
Code	Description
200	Success
contentId *
string (path) The ID of the content object to retrieve.
https://universalis.app/api/v2/extra/content/
Least-recently updated items
get - /api/v2/extra/stats/least-recently-updated
Get the least-recently updated items on the specified world or data center, along with the upload times for each item.
Responses
Code	Description
200	Success
404	The world/DC requested is invalid.
world
string (query) The world to request data for.
dcName
string (query) The data center to request data for.
entries
string (query) The number of entries to return (default 50, max 200).
https://universalis.app/api/v2/extra/stats/least-recently-updated
Market board current data
get - /api/v2/{worldDcRegion}/{itemIds}
Retrieves the data currently shown on the market board for the requested item and world or data center. Up to 100 item IDs can be comma-separated in order to retrieve data for multiple items at once.
Responses
Code	Description
200	Data retrieved successfully.
400	The parameters were invalid.
404	The world/DC or item requested is invalid. When requesting multiple items at once, an invalid item ID will not trigger this. Instead, the returned list of unresolved item IDs will contain the invalid item ID or IDs.
itemIds *
string (path) The item ID or comma-separated item IDs to retrieve data for.
worldDcRegion *
string (path) The world, data center, or region to retrieve data for. This may be an ID or a name. Regions should be specified as Japan, Europe, North-America, Oceania, China, or 中国.
listings
string (query) The number of listings to return per item. By default, all listings will be returned.
entries
string (query) The number of recent history entries to return per item. By default, a maximum of 5 entries will be returned.
hq
string (query) Filter for HQ listings and entries. By default, both HQ and NQ listings and entries will be returned.
statsWithin
string (query) The amount of time before now to calculate stats over, in milliseconds. By default, this is 7 days.
entriesWithin
string (query) The amount of time before now to take entries within, in seconds. Negative values will be ignored.
fields
string (query) A comma separated list of fields that should be included in the response, if omitted will return all fields. For example, if you're only interested in the listings price per unit you can set this to listings.pricePerUnit. Note that querying multiple items changes the response schema, which should be reflected in the value provided for this field. In this case, querying the price per unit requires setting this field to items.listings.pricePerUnit.
User-Agent
string (header)
CF-Connecting-IP
string (header)
https://universalis.app/api/v2//
Market board sale history
get - /api/v2/history/{worldDcRegion}/{itemIds}
Retrieves the history data for the requested item and world or data center. Up to 100 item IDs can be comma-separated in order to retrieve data for multiple items at once.
Responses
Code	Description
200	Data retrieved successfully.
404	The world/DC or item requested is invalid. When requesting multiple items at once, an invalid item ID will not trigger this. Instead, the returned list of unresolved item IDs will contain the invalid item ID or IDs.
itemIds *
string (path) The item ID or comma-separated item IDs to retrieve data for.
worldDcRegion *
string (path) The world or data center to retrieve data for. This may be an ID or a name. Regions should be specified as Japan, Europe, North-America, Oceania, China, or 中国.
entriesToReturn
string (query) The number of entries to return per item. By default, this is set to 1800, but may be set to a maximum of 99999.
statsWithin
string (query) The amount of time before now to calculate stats over, in milliseconds. By default, this is 7 days.
entriesWithin
string (query) The amount of time before entriesUntil or now to take entries within, in seconds. Negative values will be ignored. By default, this is 7 days.
entriesUntil
string (query) The UNIX timestamp in seconds to take entries until. Negative values will be ignored. By default, this is current time.
minSalePrice
0
integer (query) The inclusive minimum unit sale price of entries to return.
maxSalePrice
2147483647
integer (query) The inclusive maximum unit sale price of entries to return.
User-Agent
string (header)
CF-Connecting-IP
string (header)
https://universalis.app/api/v2/history//?minSalePrice=0&maxSalePrice=2147483647
Market tax rates
get - /api/v2/tax-rates
Retrieves the current tax rate data for the specified world. This data is provided by the Retainer Vocate in each major city.
Responses
Code	Description
200	Data retrieved successfully.
404	The world requested is invalid.
world
string (query) The world or to retrieve data for. This may be an ID or a name.
User-Agent
string (header)
https://universalis.app/api/v2/tax-rates
Marketable items
get - /api/v2/marketable
Returns the set of marketable item IDs.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/marketable
Most-recently updated items
get - /api/v2/extra/stats/most-recently-updated
Get the most-recently updated items on the specified world or data center, along with the upload times for each item.
Responses
Code	Description
200	Success
404	The world/DC requested is invalid.
world
string (query) The world to request data for.
dcName
string (query) The data center to request data for.
entries
string (query) The number of entries to return (default 50, max 200).
https://universalis.app/api/v2/extra/stats/most-recently-updated
Recently updated items
get - /api/v2/extra/stats/recently-updated
Returns a list of some of the most recently updated items on the website. This endpoint is a legacy endpoint and does not include any data on which worlds or data centers the updates happened on.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/extra/stats/recently-updated
Upload counts by upload application
get - /api/v2/extra/stats/uploader-upload-counts
Returns the total upload counts for each client application that uploads data to Universalis.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/extra/stats/uploader-upload-counts
Upload counts by world
get - /api/v2/extra/stats/world-upload-counts
Returns the world upload counts and proportions of the total uploads for each world.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/extra/stats/world-upload-counts
Uploads per day
get - /api/v2/extra/stats/upload-history
Returns the number of uploads per day over the past 30 days.
Responses
Code	Description
200	Success
https://universalis.app/api/v2/extra/stats/upload-history
User lists
get - /api/v2/lists/{listId}
Retrieves a user list.
Responses
Code	Description
200	Data retrieved successfully.
404	The list requested does not exist.
listId *
string (path) The ID of the list to retrieve.
https://universalis.app/api/v2/lists/
Entities
Microsoft.AspNetCore.Mvc.ProblemDetails

interface Microsoft.AspNetCore.Mvc.ProblemDetails {
  type?: string;
  title?: string;
  status?: number; // int32
  detail?: string;
  instance?: string;
}
Universalis.Application.Views.V1.CurrentlyShownView

interface Universalis.Application.Views.V1.CurrentlyShownView {
  // The item ID.
  itemID: number; // int32
  // The world ID, if applicable.
  worldID?: number; // int32
  // The last upload time for this endpoint, in milliseconds since the UNIX epoch.
  lastUploadTime: number; // int64
  // The currently-shown listings.
  listings?: Universalis.Application.Views.V1.ListingView[];
  // The currently-shown sales.
  recentHistory?: Universalis.Application.Views.V1.SaleView[];
  // The DC name, if applicable.
  dcName?: string;
  // The region name, if applicable.
  regionName?: string;
  // The average listing price.
  currentAveragePrice: number;
  // The average NQ listing price.
  currentAveragePriceNQ: number;
  // The average HQ listing price.
  currentAveragePriceHQ: number;
  // The average number of sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  // This number will tend to be the same for every item, because the number of shown sales is the same and over the same period.
  // This statistic is more useful in historical queries.
  regularSaleVelocity: number;
  // The average number of NQ sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  // This number will tend to be the same for every item, because the number of shown sales is the same and over the same period.
  // This statistic is more useful in historical queries.
  nqSaleVelocity: number;
  // The average number of HQ sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  // This number will tend to be the same for every item, because the number of shown sales is the same and over the same period.
  // This statistic is more useful in historical queries.
  hqSaleVelocity: number;
  // The average sale price.
  averagePrice: number;
  // The average NQ sale price.
  averagePriceNQ: number;
  // The average HQ sale price.
  averagePriceHQ: number;
  // The minimum listing price.
  minPrice: number; // int32
  // The minimum NQ listing price.
  minPriceNQ: number; // int32
  // The minimum HQ listing price.
  minPriceHQ: number; // int32
  // The maximum listing price.
  maxPrice: number; // int32
  // The maximum NQ listing price.
  maxPriceNQ: number; // int32
  // The maximum HQ listing price.
  maxPriceHQ: number; // int32
  // A map of quantities to listing counts, representing the number of listings of each quantity.
  stackSizeHistogram?: Object;
  // A map of quantities to NQ listing counts, representing the number of listings of each quantity.
  stackSizeHistogramNQ?: Object;
  // A map of quantities to HQ listing counts, representing the number of listings of each quantity.
  stackSizeHistogramHQ?: Object;
  // The world name, if applicable.
  worldName?: string;
  // The last upload times in milliseconds since epoch for each world in the response, if this is a DC request.
  worldUploadTimes?: Object;
  // The number of listings retrieved for the request. When using the "listings" limit parameter, this may be
  // different from the number of sale entries returned in an API response.
  listingsCount: number; // int32
  // The number of sale entries retrieved for the request. When using the "entries" limit parameter, this may be
  // different from the number of sale entries returned in an API response.
  recentHistoryCount: number; // int32
  // The number of items (not listings) up for sale.
  unitsForSale: number; // int32
  // The number of items (not sale entries) sold over the retrieved sales.
  unitsSold: number; // int32
  // Whether this item has ever been updated. Useful for newly-released items.
  hasData: boolean;
}
Universalis.Application.Views.V1.Extra.ContentView

interface Universalis.Application.Views.V1.Extra.ContentView {
  // The content ID of the object.
  contentID?: string;
  // The content type of this object.
  contentType?: string;
  // The character name associated with this character object, if this is one.
  characterName?: string;
}
Universalis.Application.Views.V1.Extra.Stats.MostRecentlyUpdatedItemsView

interface Universalis.Application.Views.V1.Extra.Stats.MostRecentlyUpdatedItemsView {
  // A list of item upload information in timestamp-descending order.
  items?: Universalis.Application.Views.V1.Extra.Stats.WorldItemRecencyView[];
}
Universalis.Application.Views.V1.Extra.Stats.RecentlyUpdatedItemsView

interface Universalis.Application.Views.V1.Extra.Stats.RecentlyUpdatedItemsView {
  // A list of item IDs, with the most recent first.
  items?: number[];
}
Universalis.Application.Views.V1.Extra.Stats.SourceUploadCountView

interface Universalis.Application.Views.V1.Extra.Stats.SourceUploadCountView {
  // The name of the client application.
  sourceName?: string;
  // The number of uploads originating from the client application.
  uploadCount: number;
}
Universalis.Application.Views.V1.Extra.Stats.UploadCountHistoryView

interface Universalis.Application.Views.V1.Extra.Stats.UploadCountHistoryView {
  // The list of upload counts per day, over the past 30 days.
  uploadCountByDay?: number[];
}
Universalis.Application.Views.V1.Extra.Stats.WorldItemRecencyView

interface Universalis.Application.Views.V1.Extra.Stats.WorldItemRecencyView {
  // The item ID.
  itemID: number; // int32
  // The last upload time for the item on the listed world.
  lastUploadTime: number;
  // The world ID.
  worldID: number; // int32
  // The world name.
  worldName?: string;
}
Universalis.Application.Views.V1.Extra.Stats.WorldUploadCountView

interface Universalis.Application.Views.V1.Extra.Stats.WorldUploadCountView {
  // The number of times an upload has occurred on this world.
  count: number;
  // The proportion of uploads on this world to the total number of uploads.
  proportion: number;
}
Universalis.Application.Views.V1.HistoryView

interface Universalis.Application.Views.V1.HistoryView {
  // The item ID.
  itemID: number; // int32
  // The world ID, if applicable.
  worldID?: number; // int32
  // The last upload time for this endpoint, in milliseconds since the UNIX epoch.
  lastUploadTime: number; // int64
  // The historical sales.
  entries?: Universalis.Application.Views.V1.MinimizedSaleView[];
  // The DC name, if applicable.
  dcName?: string;
  // The region name, if applicable.
  regionName?: string;
  // A map of quantities to sale counts, representing the number of sales of each quantity.
  stackSizeHistogram?: Object;
  // A map of quantities to NQ sale counts, representing the number of sales of each quantity.
  stackSizeHistogramNQ?: Object;
  // A map of quantities to HQ sale counts, representing the number of sales of each quantity.
  stackSizeHistogramHQ?: Object;
  // The average number of sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  regularSaleVelocity: number;
  // The average number of NQ sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  nqSaleVelocity: number;
  // The average number of HQ sales per day, over the past seven days (or the entirety of the shown sales, whichever comes first).
  hqSaleVelocity: number;
  // The world name, if applicable.
  worldName?: string;
}
Universalis.Application.Views.V1.ListingView

interface Universalis.Application.Views.V1.ListingView {
  // The time that this listing was posted, in seconds since the UNIX epoch.
  lastReviewTime: number; // int64
  // The price per unit sold.
  pricePerUnit: number; // int32
  // The stack size sold.
  quantity: number; // int32
  // The ID of the dye on this item.
  stainID: number; // int32
  // The world name, if applicable.
  worldName?: string;
  // The world ID, if applicable.
  worldID?: number; // int32
  // The creator's character name.
  creatorName?: string;
  // A SHA256 hash of the creator's ID.
  creatorID?: string;
  // Whether or not the item is high-quality.
  hq: boolean;
  // Whether or not the item is crafted.
  isCrafted: boolean;
  // The ID of this listing.
  listingID?: string;
  // The materia on this item.
  materia?: Universalis.Application.Views.V1.MateriaView[];
  // Whether or not the item is being sold on a mannequin.
  onMannequin: boolean;
  // The city ID of the retainer. This is a game ID; all possible values can be seen at
  // https://xivapi.com/Town.
  //             
  // Limsa Lominsa = 1
  // Gridania = 2
  // Ul'dah = 3
  // Ishgard = 4
  // Kugane = 7
  // Crystarium = 10
  // Old Sharlayan = 12
  retainerCity: number; // int32
  // The retainer's ID.
  retainerID?: string;
  // The retainer's name.
  retainerName?: string;
  // A SHA256 hash of the seller's ID.
  sellerID?: string;
  // The total price.
  total: number; // int32
  // The Gil sales tax (GST) to be added to the total price during purchase.
  tax: number; // int32
}
Universalis.Application.Views.V1.MateriaView

interface Universalis.Application.Views.V1.MateriaView {
  // The materia slot.
  slotID: number; // int32
  // The materia item ID.
  materiaID: number; // int32
}
Universalis.Application.Views.V1.MinimizedSaleView

interface Universalis.Application.Views.V1.MinimizedSaleView {
  // Whether or not the item was high-quality.
  hq: boolean;
  // The price per unit sold.
  pricePerUnit: number; // int32
  // The stack size sold.
  quantity: number; // int32
  // The buyer's character name. This may be null.
  buyerName?: string;
  // Whether or not this was purchased from a mannequin. This may be null.
  onMannequin?: boolean;
  // The sale time, in seconds since the UNIX epoch.
  timestamp: number; // int64
  // The world name, if applicable.
  worldName?: string;
  // The world ID, if applicable.
  worldID?: number; // int32
}
Universalis.Application.Views.V1.SaleView

interface Universalis.Application.Views.V1.SaleView {
  // Whether or not the item was high-quality.
  hq: boolean;
  // The price per unit sold.
  pricePerUnit: number; // int32
  // The stack size sold.
  quantity: number; // int32
  // The sale time, in seconds since the UNIX epoch.
  timestamp: number; // int64
  // Whether or not this was purchased from a mannequin. This may be null.
  onMannequin?: boolean;
  // The world name, if applicable.
  worldName?: string;
  // The world ID, if applicable.
  worldID?: number; // int32
  // The buyer name.
  buyerName?: string;
  // The total price.
  total: number; // int32
}
Universalis.Application.Views.V1.TaxRatesView

interface Universalis.Application.Views.V1.TaxRatesView {
  // The percent retainer tax in Limsa Lominsa.
  Limsa Lominsa: number; // int32
  // The percent retainer tax in Gridania.
  Gridania: number; // int32
  // The percent retainer tax in Ul'dah.
  Ul'dah: number; // int32
  // The percent retainer tax in Ishgard.
  Ishgard: number; // int32
  // The percent retainer tax in Kugane.
  Kugane: number; // int32
  // The percent retainer tax in the Crystarium.
  Crystarium: number; // int32
  // The percent retainer tax in Old Sharlayan.
  Old Sharlayan: number; // int32
  // The percent retainer tax in Tuliyollal.
  Tuliyollal: number; // int32
}
Universalis.Application.Views.V2.AggregatedMarketBoardData

interface Universalis.Application.Views.V2.AggregatedMarketBoardData {
  results?: Universalis.Application.Views.V2.AggregatedMarketBoardData+Result[];
  failedItems?: number[];
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+AggregatedResult

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+AggregatedResult {
  minListing: Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing;
  medianListing: Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing;
  recentPurchase: Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase;
  averageSalePrice: Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice;
  dailySaleVelocity: Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice {
  world: Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry;
  dc: Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry;
  region: Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+AverageSalePrice+Entry {
  price: number;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity {
  world: Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry;
  dc: Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry;
  region: Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+DailySaleVelocity+Entry {
  quantity: number;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing {
  world: Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry;
  dc: Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry;
  region: Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+MedianListing+Entry {
  price: number; // int32
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing {
  world: Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry;
  dc: Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry;
  region: Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+MinListing+Entry {
  price: number; // int32
  worldId?: number; // int32
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase {
  world: Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry;
  dc: Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry;
  region: Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry;
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+RecentPurchase+Entry {
  price: number; // int32
  timestamp: number; // int64
  worldId?: number; // int32
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+Result

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+Result {
  itemId: number; // int32
  nq: Universalis.Application.Views.V2.AggregatedMarketBoardData+AggregatedResult;
  hq: Universalis.Application.Views.V2.AggregatedMarketBoardData+AggregatedResult;
  worldUploadTimes?: Universalis.Application.Views.V2.AggregatedMarketBoardData+WorldUploadTime[];
}
Universalis.Application.Views.V2.AggregatedMarketBoardData+WorldUploadTime

interface Universalis.Application.Views.V2.AggregatedMarketBoardData+WorldUploadTime {
  worldId: number; // int32
  timestamp: number; // int64
}
Universalis.Application.Views.V2.CurrentlyShownMultiViewV2

interface Universalis.Application.Views.V2.CurrentlyShownMultiViewV2 {
  // The item IDs that were requested.
  itemIDs?: number[];
  // The item data that was requested, keyed on the item ID.
  items?: Object;
  // The ID of the world requested, if applicable.
  worldID?: number; // int32
  // The name of the DC requested, if applicable.
  dcName?: string;
  // The name of the region requested, if applicable.
  regionName?: string;
  // A list of IDs that could not be resolved to any item data.
  unresolvedItems?: number[];
  // The name of the world requested, if applicable.
  worldName?: string;
}
Universalis.Application.Views.V2.HistoryMultiViewV2

interface Universalis.Application.Views.V2.HistoryMultiViewV2 {
  // The item IDs that were requested.
  itemIDs?: number[];
  // The item data that was requested, keyed on the item ID.
  items?: Object;
  // The ID of the world requested, if applicable.
  worldID?: number; // int32
  // The name of the DC requested, if applicable.
  dcName?: string;
  // The name of the region requested, if applicable.
  regionName?: string;
  // A list of IDs that could not be resolved to any item data.
  unresolvedItems?: number[];
  // The name of the world requested, if applicable.
  worldName?: string;
}
Universalis.Application.Views.V2.UserListView

interface Universalis.Application.Views.V2.UserListView {
  // The list's ID.
  id?: string;
  // The time that this list was created, in milliseconds since the UNIX epoch.
  created?: string;
  // The time that this list was updated, in milliseconds since the UNIX epoch.
  updated?: string;
  // The name of this list.
  name?: string;
  // The IDs of the list items.
  itemIDs?: number[];
}
Universalis.Application.Views.V3.Game.DataCenter

interface Universalis.Application.Views.V3.Game.DataCenter {
  name?: string;
  region?: string;
  worlds?: number[];
}
Universalis.Application.Views.V3.Game.World

interface Universalis.Application.Views.V3.Game.World {
  id: number; // int32
  name?: string;
}





API Version
v2

Universalis WebSocket API
Universalis offers a WebSocket API for retrieving some types of data in real time. When using the WebSocket API, the client is expected to perform all data processing itself; precalculated fields such as averages and minimum/maximum prices will not be provided. WebSocket data is binary-serialized using BSON. Most programming languages should have a BSON library available online for use in deserializing data. WebSocket messages are not compressed.
The WebSocket API is likely not suited to spreadsheet-based applications such as Google Sheets or Microsoft Excel.
This page gives demonstrations on how to use the WebSocket API. A full API reference is not currently available.
Getting started
To begin, connect to the WebSocket endpoint and set up BSON deserializtion.

Node

Python

import { serialize, deserialize } from "bson";
import WebSocket from "ws";

const addr = "wss://universalis.app/api/ws";

const ws = new WebSocket(addr);

ws.on("open", () => {
  ws.send(serialize({ event: "subscribe", channel: "listings/add" }));
  console.log("Connection opened.");
});

ws.on("close", () => console.log("Connection closed."));

ws.on("message", data => {
    const message = deserialize(data);
    console.log(message);
});
Initially, no data will be received from the WebSocket server. The data sent by the server is controlled by event channels, which clients must subscribe to. There are currently four event channels:
listings/add
listings/remove
sales/add
sales/remove
To subscribe to an event channel, send a subscribe event to the server, specifying the channel you wish to receive messages from. Note that messages to the server must be BSON-serialized.

Node

Python

import { deserialize, serialize } from "bson";

// ...

ws.on("open", () => {
  ws.send(serialize({ event: "subscribe", channel: "listings/add" }));
  console.log("Connection opened.");
});
Running the client should now cause your console to be flooded with messages from the server. Keep an eye on your application's memory usage; you may be receiving messages faster than your application is processing them.
Unsubscribing from an event channel works in a similar manner:

Node

Python

ws.send(serialize({ event: "unsubscribe", channel: "listings/add" }));
Events can be filtered by appending a filter string to your subscribe request. Filter strings are comma-separated lists of fields that should be matched on sent messages. For example, messages on the listings/add channel have a world field, containing the world ID of the listing upload data. Adding {world=73} to the event channel will filter uploads to Adamantoise only:

Node

Python

ws.send(serialize({ event: "subscribe", channel: "listings/add{world=73}" }));
Multiple subscriptions on the same channel can be made, in order to join filters on the same field in an OR pattern. Here, we subscribe to Adamantoise and Gilgamesh at the same time:

Node

Python

ws.send(serialize({ event: "subscribe", channel: "listings/add{world=73}" }));
ws.send(serialize({ event: "subscribe", channel: "listings/add{world=63}" }));
Feel free to experiment with other combinations of channels and filters to refine the data you receive. Keep in mind that Universalis provides service to both the Global and Chinese game regions, so you probably won't want to listen on any channel without any filters at all.
BSON Data Format
All data sent over the websocket is formatted via BSON, same as the subscribe requests, and will need to be passed through a BSON decoder/parser in order to be used in your application, please make sure to review the comments as some fields can be NULL or not included in some requests. Converting this for your specific language will require review of your languages BSON parser, as there may be case sensitivity issues. The following is a JSON representation for your convenience.

Node

{
  /* This corresponds to the subscribe information */
  "event": "listings/add",
  /* Item ID being sent in this message */
  "item": 23122,
  /* World ID being sent in this message */
  "world": 2,
  /* This key is not present for sales subscriptions */
  "listings": [
    {
      /* This field is often NULL */
      "creatorID": 0,
      /* This is often an empty string */
      "creatorName": "",
      "hq": true,
      "isCrafted": false,
      /* Most recent upload date */
      "lastReviewTime": 1674368621,
      /* Unique hash used to identify a listing for removal */
      "listingID": "b5399af38b63eea4a3ceca6aa68692451076109b3a20c39f4be79c522f541cfc",
      "materia": [
        {
          /* Slot ID the materia is in */
          "slotID": 0,
          /* This is the materia id, which is not the item ID, use https://xivapi.com/materia/<id> to look up details if needed */
          "materiaID": 0
        }
      ],
      "onMannequin": false,
      "pricePerUnit": 20999,
      "quantity": 10,
      "retainerCity": 12,
      "retainerID": "98702c8262940d99d76cdc236324c18351a8d6dcf764d1f97b376f87bc22036f",
      "retainerName": "xyzzy",
      "sellerID": "74ce52ff2a2b7625bacdd4dace29d3abbbf2431e71f2aa8519905f437dd9fed9",
      "stainID": 0,
      "total": 209990,
      /* This field is often NULL */
      "worldID": 0,
      /* This field is often NULL */
      "worldName": ""
    }
  ],
  /* This key is not present for listings subscriptions */
  "sales": [
    {
      "buyerName": "xyzzy",
      "hq": false,
      "onMannequin": false,
      "pricePerUnit": 20999,
      "quantity": 10,
      "timestamp": 1674411943,
      "total": 209990,
      /* This field is often NULL */
      "worldID": 0,
      /* This field is often NULL */
      "worldName": ""
    }
  ]
}
