export const SERVER_INSTRUCTIONS = `Use this server to analyze FFXIV market data via Universalis and item data via XIVAPI.

Tool guide:
- universalis_rank_items_by_profitability: best for "most profitable to farm" questions with cost inputs; ranks by demand and profit.
- universalis_resolve_items_by_names: bulk name-to-ID resolution in one query; prefer over per-item search.
- universalis_resolve_items_by_name: single-item name search.
- universalis_get_item_by_id: fetch one item row by ID from XIVAPI.
- universalis_get_items_by_ids: fetch multiple item rows by ID in one request.

- universalis_get_aggregated_prices: cached summary stats (min listing, recent purchase, averages, velocity). Use for most analysis.
- universalis_get_current_listings: listings + recent history when the user needs live listings or example sales.
- universalis_get_sales_history: detailed sales history when trend analysis or filters are required.

- universalis_list_worlds: list and validate worlds.
- universalis_list_data_centers: list and validate data centers.
- universalis_get_tax_rates: current tax rates for a world.
- universalis_list_marketable_items: marketable item IDs (paginate).
- universalis_get_list: retrieve a Universalis list by ID.
- universalis_get_content: content metadata by ID (best-effort endpoint).

- universalis_get_most_recent_updates: most recently updated items for a world or DC.
- universalis_get_least_recent_updates: least recently updated items for a world or DC.
- universalis_get_recent_updates: legacy list of recently updated items (no world/DC info).
- universalis_get_upload_counts_by_source: upload counts by client app.
- universalis_get_upload_counts_by_world: upload counts by world.
- universalis_get_upload_history: daily upload totals for the last 30 days.

Notes:
- world_dc_region accepts a world name/ID, data center name, or region.
- response_format defaults to markdown; use json for structured processing.
`;
