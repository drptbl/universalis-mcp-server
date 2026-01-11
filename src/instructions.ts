export const SERVER_INSTRUCTIONS = `Use this server to analyze FFXIV market data via Universalis and Saddlebag Exchange, plus item data via XIVAPI.

Tool guide:
- universalis_rank_items_by_profitability: best for "most profitable to farm" questions with cost inputs; ranks by demand and profit (defaults to best HQ/NQ price, can filter unmarketable items, and includes supply metrics).
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

Saddlebag tools (FFXIV):
- saddlebag_get_listing_metrics: listing competition metrics and current listings.
- saddlebag_get_history_metrics: aggregated history metrics and price distributions.
- saddlebag_get_raw_stats: daily snapshot stats (median, average, sales volume).
- saddlebag_get_scrip_exchange: gil-per-scrip rankings.
- saddlebag_get_shopping_list: crafting shopping list (may return exception payloads).
- saddlebag_get_export_prices: cross-world price comparison for export trading.
- saddlebag_get_marketshare: marketshare leaderboard snapshot for a server.
- saddlebag_get_reselling_scan: reselling opportunities (region/DC/vendor filters).
- saddlebag_get_weekly_price_group_delta: weekly deltas for custom item groups.
- saddlebag_get_price_check: price alert checks (user-supplied auctions).
- saddlebag_get_quantity_check: quantity alert checks (user-supplied auctions).
- saddlebag_get_sale_alert: sale alerts for retainer listings.
- saddlebag_get_craftsim: crafting profitability scan (use max_results to limit payloads).
- saddlebag_get_blog_description: item description text lookup.

Wiki tools:
- wiki_list_pages: list curated Saddlebag/Universalis guide pages.
- wiki_get_page: fetch a wiki page by slug for extra context.

Notes:
- world_dc_region accepts a world name/ID, data center name, or region.
- response_format defaults to markdown; use json for structured processing.
- Materia categories like "Combat Materia VII", "Crafting Materia VII", and "Gathering Materia VII" are expanded to their specific item names; grade is required.
- Bulk resolve and profitability tools can fall back to partial matches for unresolved exact inputs; check match_type for "fallback_partial".
- Materia expansion uses cached XIVAPI data; refresh is controlled by MATERIA_CACHE_TTL_MS and MATERIA_REFRESH.
- Profitability tool options: marketable_only (default true), min_velocity threshold, include_supply (default true).
- price_variant defaults to "best".
- Prefer Universalis for raw listings/sales history; use Saddlebag for competition metrics, rankings, and aggregate distributions.
- Saddlebag best-deals is excluded (premium gated + inconsistent API validation).
- Some Saddlebag endpoints call Universalis directly; be mindful of rate limits.
- saddlebag_get_raw_stats supports item_ids = -1 for all items and can return very large payloads.
- Wiki pages are curated snapshots; refresh with scripts/update-wiki-docs.mjs as needed.
`;
