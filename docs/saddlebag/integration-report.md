# Saddlebag API integration report and plan

## Scope
- Reviewed `docs/saddlebag/openapi.json` and `docs/saddlebag/saddlebag.md`.
- Probed live endpoints at `https://docs.saddlebagexchange.com/api` to capture response shapes.
- Focused on FFXIV endpoints only.

## Base URL and spec notes
- `docs/saddlebag/saddlebag.md` points to `https://docs.saddlebagexchange.com/api` and that host works.
- `https://saddlebagexchange.com/api` returns HTML 404 and should not be used as the API base.
- `openapi.json` defines request schemas but all response schemas are empty (`{}`); we must define output schemas manually.
- Live OpenAPI exists at `https://docs.saddlebagexchange.com/openapi.json` and matches the local copy.

## Probed endpoint response shapes (observed)
### `/api/ffxiv/blog` (POST)
Request params (OpenAPI): `item_id` (int).
Response (observed):
```ts
type FfxivBlogResponse = {
  itemID: number;
  itemDescription: string;
};
```
Notes: `itemDescription` is long-form text; expect large strings.

### `/api/ffxivrawstats` (POST)
Request params (OpenAPI): `region` (string), `item_ids` (number[]).
Response (observed):
```ts
type FfxivRawStatsEntry = {
  itemID: number;
  itemName: string;
  mainCategory: number;
  subCategory: number;
  medianNQ: number;
  averageNQ: number;
  salesAmountNQ: number;
  quantitySoldNQ: number;
  medianHQ: number;
  averageHQ: number;
  salesAmountHQ: number;
  quantitySoldHQ: number;
  lastUpdateTimeUnix: number;
};

type FfxivRawStatsResponse = Record<string, FfxivRawStatsEntry>;
```

### `/api/ffxiv/v2/listing` (POST)
Request params (OpenAPI): `item_id`, `home_server`, optional `initial_days`, `end_days` (deprecated).
Response (observed):
```ts
type FfxivListingV2Response = {
  listing_time_diff: { avg_time_diff: number; median_time_diff: number };
  listing_price_diff: { avg_price_diff: number; median_price_diff: number };
  min_price: number;
  listings: Array<{
    pricePerUnit: number;
    quantity: number;
    total: number;
    hq: boolean;
    retainerName: string;
    lastReviewTime: string;
    unix_timestamp: number;
  }>;
  priceTimeData: unknown[];
  priceTimeDataHQ: unknown[];
  quantityTimeData: unknown[];
  quantityTimeDataHQ: unknown[];
  timestamps: number[];
  current_price_vs_median_percent: number;
  current_hq_price_vs_median_percent: number;
  current_quantity_vs_median_percent: number;
  current_hq_quantity_vs_median_percent: number;
};
```
Notes: `priceTimeData*` and `quantityTimeData*` were empty in the sample, so their element shape is unknown.

### `/api/ffxiv/v2/history` (POST)
Request params (OpenAPI): `item_id`, `home_server`, optional `item_type` (`hq_only|nq_only|all`), `initial_days`, `end_days` (deprecated).
Response (observed):
```ts
type FfxivHistoryV2Response = {
  itemID: number;
  total_purchase_amount: number;
  total_quantity_sold: number;
  average_quantity_sold_per_day: number;
  average_sales_per_day: number;
  median_ppu: number;
  average_ppu: number;
  price_history: Array<{ price_range: string; sales_amount: number }>;
  stack_chance: Array<{
    stack_size: number;
    number_of_sales: number;
    percent_of_sales: number;
    percent_of_total_quantity_sold: number;
    average_price_for_size: number;
  }>;
  dirty_sales: unknown[];
  home_server_sales_by_hour_chart: Array<{ time: number; sale_amt: number }>;
  server_distribution: Record<string, number>;
};
```
Notes: `dirty_sales` was empty in the sample, so the element shape is unknown.

### `/api/ffxiv/scripexchange` (POST)
Request params (OpenAPI): `home_server`, `color`.
Response (observed):
```ts
type FfxivScripExchangeItem = {
  itemID: number;
  itemName: string;
  cost: number;
  minPrice: number;
  salesAmountNQ: number;
  quantitySoldNQ: number;
  medianNQ: number;
  averageNQ: number;
  valuePerScrip: number;
  saddleLink: string;
  uniLink: string;
  webpage: string;
};

type FfxivScripExchangeResponse = {
  data: FfxivScripExchangeItem[];
};
```

### `/api/v2/craftsim` (POST)
Request params (OpenAPI): `home_server`, `cost_metric`, `revenue_metric`, `sales_per_week`, `median_sale_price`, `max_material_cost`, `filters`, `jobs`, `stars`, `lvl_lower_limit`, `lvl_upper_limit`, `yields`, `hide_expert_recipes`.
Response (observed):
```ts
type FfxivCraftsimEntry = {
  itemID: number;
  itemName: string;
  yieldsPerCraft: number;
  itemData: string;
  universalisLink: string;
  costEst: {
    material_min_listing_cost: number;
    material_avg_cost: number;
    material_median_cost: number;
  };
  revenueEst: {
    revenue_home_min_listing: number;
    revenue_region_min_listing: number;
    revenue_avg: number;
    revenue_median: number;
  };
  hq: boolean;
  soldPerWeek: number;
  profitEst: number;
};

type FfxivCraftsimResponse = {
  data: FfxivCraftsimEntry[];
  item_ids: number[];
  missing_materials: number[];
  missing_materials_ids: number[];
  missing_stats: number[];
  missing_stats_ids: number[];
  untradable_items: Array<{
    materialID: number;
    hq: boolean;
    craftID: number;
    quantity: number;
  }>;
};
```
Notes: responses can be very large (thousands of entries).

### `/api/v2/shoppinglist` (POST)
Request params (OpenAPI): `home_server`, `shopping_list` (array of `{itemID, craft_amount, hq, job}`), `region_wide`, `ignore_after_hours`.
Response (observed):
Success case:
```ts
type FfxivShoppingListResponse = {
  data: Array<{
    pricePerUnit: number;
    quantity: number;
    worldName: string;
    hq: boolean;
    itemID: number;
    name: string;
  }>;
};
```
Error case (observed with itemID 5333):
```ts
type FfxivShoppingListError = {
  exception: string;
};
```
Notes: some item IDs return `exception` even when the request is valid; treat as a non-HTTP error payload.

### `/api/bestdeals` (POST)
Request params (OpenAPI): `home_server`, `discount`, `medianPrice`, `salesAmount`, `maxBuyPrice`, `filters`.
Observed behavior:
- Response complains about missing `hq_only`, even though the schema does not include it.
- Supplying `hq_only` yields `APITypeException` ("extra arguments are not permitted") in a separate test.
- Best-deals UI is premium gated. Loader response includes `isLoggedIn` and `hasPremium` flags; with `hasPremium=false`, the UI never calls the API.
- The recommended best-deals links use query params including `hq_only`.
- Main domain `/api/bestdeals` returns HTML 404.
- Cross-origin `fetch` to the docs host from the web UI fails due to CORS.

Observed error shape:
```ts
type FfxivBestDealsError = {
  Type: string;
  Message: string;
  Elements: string[];
};
```

## Additional probed endpoint response shapes (observed)
### `/api/export` (POST)
Request params (OpenAPI): `home_server`, `export_servers`, `item_ids`, `hq_only`.
Response (observed):
```ts
type FfxivExportResponse = {
  data: Array<{
    item_id: number;
    export_servers: Array<{
      server_name: string;
      price: number;
    }>;
  }>;
};
```

### `/api/ffxivmarketshare` (POST)
Request params (OpenAPI): `server`, `time_period`, `sales_amount`, `average_price`, `filters`, `sort_by`.
Response (observed):
```ts
type FfxivMarketshareResponse = {
  data: Array<{
    avg: number;
    itemID: string;
    marketValue: number;
    median: number;
    minPrice: number;
    name: string;
    npc_vendor_info: string;
    purchaseAmount: number;
    quantitySold: number;
    url: string;
    percentChange: number;
    state: string;
  }>;
};
```
Notes: `itemID` is a string in responses.

### `/api/history` (POST) and `/api/listing` (POST)
Request params (OpenAPI): same as v2 `history`/`listing`.
Response (observed):
- `/api/history` matches the v2 history response shape.
- `/api/listing` matches the v2 listing response shape but omits `priceTimeData*`, `quantityTimeData*`, `timestamps`, and `current_*` fields.

### `/api/parseallagan` (POST)
Request params (OpenAPI): `server`, `allagan_json_data` (array).
Response (observed with empty input):
```ts
type FfxivParseAllaganResponse = {
  sale_alert_json: Record<string, unknown>;
  sale_items_not_up_to_date: unknown[];
  undercut_alert_json: Record<string, unknown>;
  undercut_items_not_up_to_date: unknown[];
  in_bags_report: unknown[];
};
```
Notes: real payload shape likely depends on the Allagan Tools data.

### `/api/pricecheck` (POST)
Request params (OpenAPI): `home_server`, `dc_only`, `user_auctions`.
Response (observed):
```ts
type FfxivPriceCheckResponse = {
  matching: Array<{
    itemID: number;
    price: number;
    desired_state: string;
    hq: boolean;
    server: string;
    dc: string;
    minPrice: number;
    minListingQuantity: number;
    itemName: string;
    match_desire: boolean;
  }>;
  not_matching: unknown[];
};
```

### `/api/quantitycheck` (POST)
Request params (OpenAPI): `home_server`, `user_auctions`.
Response (observed):
```ts
type FfxivQuantityCheckResponse = {
  matching: unknown[];
  not_found: number[];
  server: string;
};
```
Notes: `matching` was empty in the sample; real entry shape unknown.

### `/api/scan` (POST)
Request params (OpenAPI): reselling search parameters.
Response (observed):
```ts
type FfxivScanResponse = {
  data: Array<{
    ROI: number;
    avg_ppu: number;
    home_server_price: number;
    home_update_time: string;
    item_id: string;
    npc_vendor_info: string;
    ppu: number;
    profit_amount: number;
    profit_raw_percent: number;
    real_name: string;
    sale_rates: string;
    server: string;
    stack_size: number;
    update_time: string;
    url: string;
    regionWeeklyMedianNQ: number;
    regionWeeklyAverageNQ: number;
    regionWeeklySalesAmountNQ: number;
    regionWeeklyQuantitySoldNQ: number;
    regionWeeklyMedianHQ: number;
    regionWeeklyAverageHQ: number;
    regionWeeklySalesAmountHQ: number;
    regionWeeklyQuantitySoldHQ: number;
  }>;
};
```
Notes: `item_id` is a string in responses.

### `/api/salealert` (POST)
Request params (OpenAPI): `retainer_names`, `server`, `item_ids`, `seller_id`.
Response (observed):
```ts
type FfxivSaleAlertResponse = {
  sold_ids: number[];
  listed_ids: number[];
  auction_data: Record<string, { link: string; min_price: number; name: string }>;
  server: string;
};
```

### `/api/selfpurchase` (POST)
Request params (OpenAPI): `server`, `player_name`.
Response (observed):
```ts
type FfxivSelfPurchaseResponse = {
  exception: string;
};
```

### `/api/undercut` (POST)
Request params (OpenAPI): `retainer_names`, `server`, `hq_only`, plus optional filters.
Response (observed):
```ts
type FfxivUndercutResponse = Record<string, unknown>;
```
Notes: empty response for sample data; real response shape still unknown.

### `/api/ffxiv/shortagefutures` (POST)
Request params (OpenAPI): `home_server`, `filters`, `hq_only`, `desired_*` fields.
Response (observed):
```ts
type FfxivShortageFuturesResponse = {
  exception: string;
};
```
Notes: endpoint currently returns "disabled" message.

### `/api/ffxiv/weekly-price-group-delta` (POST)
Request params (OpenAPI): `region`, date range, `price_groups`, `price_setting`, `quantity_setting`, `minimum_marketshare`.
Response (observed):
```ts
type FfxivWeeklyPriceGroupDeltaResponse = Record<
  string,
  {
    deltas: Record<string, number>;
    item_names: Record<string, string>;
    item_data: Record<
      string,
      {
        itemName: string;
        itemID: number;
        weekly_data: Array<{ p: number; q: number; t: number; mrk: number; delta: number }>;
      }
    >;
  }
>;
```

## Integration opportunities for Universalis MCP (FFXIV)
Most promising endpoints for immediate value:
1. Listing and history enrichment:
   - `/api/ffxiv/v2/listing` for undercut and time-to-undercut metrics.
   - `/api/ffxiv/v2/history` for aggregated pricing and stack patterns.
2. Crafting profitability:
   - `/api/v2/craftsim` for large-scale crafting profit ranking.
   - `/api/ffxiv/scripexchange` for scrip-to-gil optimization.
3. Bulk market stats:
   - `/api/ffxivrawstats` for daily snapshot stats (median, average, sales volume).
4. Utility:
   - `/api/ffxiv/blog` for XIVAPI item descriptions.
   - `/api/v2/shoppinglist` for multi-item material sourcing.
5. Marketwide search tools:
   - `/api/scan` for reselling arbitrage.
   - `/api/export` for cross-world selling comparisons.
   - `/api/ffxivmarketshare` for item leaderboard snapshots.
   - `/api/ffxiv/weekly-price-group-delta` for group trend analysis.
6. Alerts and checks:
   - `/api/pricecheck`, `/api/quantitycheck`, `/api/salealert` (user-specific data).

Avoid for now:
- `/api/bestdeals` until schema/auth mismatch is resolved.
- `/api/ffxiv/shortagefutures` (disabled).
- `/api/undercut` until a real response shape is captured.

## Decisions (current)
- Best-deals: exclude from MCP for now (premium gated + inconsistent API validation; no login-free path found).

## Risks and constraints
- Several endpoints call Universalis directly (per OpenAPI warnings). We should add rate-limit guidance and caching in MCP.
- Response schemas are missing in OpenAPI; we must keep explicit runtime validation and be defensive against shape drift.
- `craftsim` and `rawstats` can return very large payloads; the MCP layer should support limits or slicing.
- `/api/v2/shoppinglist` can return error payloads with HTTP 200.
- Best-deals is premium gated and the public API shows inconsistent validation (`hq_only` required but rejected).
- Some endpoints return IDs as strings (`itemID` / `item_id`).

## Proposed MCP tool design (draft)
- `saddlebag_get_blog_description` -> `/api/ffxiv/blog`
- `saddlebag_get_raw_stats` -> `/api/ffxivrawstats`
- `saddlebag_get_listing_metrics` -> `/api/ffxiv/v2/listing`
- `saddlebag_get_history_metrics` -> `/api/ffxiv/v2/history`
- `saddlebag_get_scrip_exchange` -> `/api/ffxiv/scripexchange`
- `saddlebag_get_craftsim` -> `/api/v2/craftsim` (with server-side result limits)
- `saddlebag_get_shopping_list` -> `/api/v2/shoppinglist` (handle `exception` payloads)
- `saddlebag_get_export_prices` -> `/api/export`
- `saddlebag_get_marketshare` -> `/api/ffxivmarketshare`
- `saddlebag_get_reselling_scan` -> `/api/scan`
- `saddlebag_get_weekly_price_group_delta` -> `/api/ffxiv/weekly-price-group-delta`
- `saddlebag_get_price_check` -> `/api/pricecheck`
- `saddlebag_get_quantity_check` -> `/api/quantitycheck`
- `saddlebag_get_sale_alert` -> `/api/salealert`

## Plan (phased)
Phase 1: align docs and schema
- Standardize base URL to the docs host in code and docs.
- Add explicit response schemas in code for the probed endpoints.
- Add basic input validation and handle `exception` responses.

Phase 2: implement stable endpoints
- Implement MCP tools for blog/rawstats/listing/history/scrip/shoppinglist.
- Add tools for export/marketshare/scan/weekly-price-group-delta.
- Add paging or limit parameters for high-volume responses.
- Add rate-limit notes in tool descriptions (Universalis calls).

Phase 3: heavy or experimental endpoints
- Implement craftsim with defaults that bound response size.
- Add user-specific tools (pricecheck/quantitycheck/salealert/undercut) with clear input warnings.
- Treat shortagefutures as disabled unless API changes.
- Best-deals: keep excluded until upstream fixes API validation and clarifies access requirements.

Phase 4: validation and docs
- Add smoke tests for each tool and document example payloads.
- Update `src/instructions.ts` with new usage guidance.

## Local artifacts
- `/tmp/saddlebag_api_samples.json` (sample responses from probe runs).
- `/tmp/saddlebag_api_samples_v2.json` (additional sample responses for remaining FFXIV endpoints).
- `/tmp/saddlebag_live_openapi.json` (live OpenAPI snapshot).
- `/tmp/ffxiv.best-deals._index.js` (downloaded UI route code for best-deals page).
