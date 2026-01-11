Our [Market overview](https://saddlebagexchange.com/ffxiv/marketshare/queries) will show you the top 200 best items to sell on the marketboard from a number of different categories! Here you will see the best items to sell on the market board from a range of numbers to different categories! Here is where you can view items that earn the most gil, increasing in price the most, fastest selling, the most purchased, highest quality sold, and the highest average/median/minimum prices!

![image](https://user-images.githubusercontent.com/17516896/225352949-d52f8a1e-fd08-4f51-aa1a-8df282bb38e4.png)

# How to earn gil with the market overview

## TLDR:

The simplest way to earn gil with this is by selling items that are ***green*** or ***blue**** in the price overview. (These have increased in price or are out of stock, making them much more profitable to buy on other servers to sell on your own or craft/gather.)

``Tip: If it's blue it means they are extremely profitable to sell as none are listed on your market board and you can sell for any price you want to.``

First... pick a search. The weekly overview, price percent increase or fast-selling searches are great places to start. You can make your own search by changing the numbers, however, we have created searches with defaults open for public usage under the [main page for the market overviews.](https://saddlebagexchange.com/ffxiv/marketshare/queries)


Then here is how you read the chart:

*  Big boxes with a big current market value **earn lots of gil.** They are good items to buy/resell, craft, or gather
*  Little boxes with a small current market value are bad items to buy/resell, craft, or gather. (They don't earn much gil.)
*  _When the price overview is bright green:_ You should buy/resell, craft or gather and sell at __current prices__ to **earn lots of gil**
*  **Stay far away from items that are bright red!!!**: They are probably unprofitable, have crashed in price, or only show big gil earned due to gil laundering which does not show real sales.
*  **_When the price overview is light blue:_** **These items will earn high amounts of gil.** This is the best opportunity to buy/resell, craft, or gather!!! This lets you sell at any price you want to.  
*  Here's a link to find that [history overview](https://saddlebagexchange.com/queries/item-history) search to find specific items on the *Region Price History* chart. Check out [our guide on this](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/How-to-use-Item-Data-Searches-to-help-you-find-good-items-to-trade) for more info on how to use our history overview. 

## How to search for items

The market overview has several options which point out the *best* selling item based on a number of categories __depending__ on the search inputs you pick:

![image](https://user-images.githubusercontent.com/17516896/225358969-1b234617-eac9-4887-a446-6fc87d715d45.png)

* The `Sales Amount` divided by the `Time Period` gives you the sales per hour or sale rate. (i.e. how fast an item sells.)
* `Time Period` is how much time you want to search over. You can search from 1 to 168 hours. (24 hours is one day, and 168 hours is one week.)
* The `Sales Amount` is how many sales you want to find in that time period, you can pick from 1 to a max of 40 sales (we only store 40 sales in our DB, for finding data on any items selling 40 or more sales we make API calls to universalis.)
* As the most sales you can pick is 40 if you want faster-selling items then pick a lower `Time Period` to find faster sale rates.
* `Average Price` will find items that sell on average for that price or higher. The lowest amount of gil you can search for is 10 gil.
* The Item Filters will let you filter specific categories of items or multiple categories at once. Make sure to unselect the `All` checkbox if you want to search for specific categories

The `Sort Results By` is most important as it will change the results you see. To make sure our chart load correctly we only pick the top 200 items sorted by the value of the field you pick in the `Sort Results By` option:

* **Market Value:** * Simplest metric to use. Shows what items earned the most gil by adding together all sales revenue from all items that match search input to show the 200 top earners.
* **Percent Changed:** Highlights what is out of stock or has increased in price. (These are great opportunities to trade when buying from other servers to sell on your own.)
* **Purchase Amount:** This shows you the fastest-selling items. (Commonly the best items are sold within stacks of 1 or small stacks, but they are also the easiest to sell fast)
* **Quantity Sold:** This shows the items that sell the highest stacks the fastest (these are commonly fast-selling items that sell in stacks of 99 for common commodities or 9999 for crystals)
* **Average Price:** This shows the items which on average sell for the most gil, however, some very big sales can offset this.
* **Median:** This shows which items sell for the most gil on a regular basis and it's more consistent than the average price.

## Using the statistics table

![image](https://user-images.githubusercontent.com/17516896/225390829-18d70faa-4348-480a-9bd7-ef692052cb02.png)

The table below the heat map has columns that can be sorted (by clicking on the columns) and contains all the data on items with helpful links such as:

* Item Name: Name of the item
* Market Value: The amount of gil earned in the time period selected
* Percent Changed: The change in price vs the average price
* Market State: [See the info on this from the heatmap section](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/How-to-trade-using-our-FFXIV-Market-Overview#using-the-heatmap-tabs)
* Average Price: Average price in the time selected
* Median: Median price in the time selected
* Minimum Price: Current minimum price
* Purchase Amount: Amount of sales (i.e. individual purchases when users click buy on an item)
* Quantity Sold: Quantity sold (only important for items sold in stacks of more than 1)
* Item data: A link to all our charts and stats that help you decide if an item is a good one to sell
* Universalis Link: A link to see the item on universalis
* NPC Vendor: A link to the vendor info if the item is sold by a vendor in-game

## Using the heatmap tabs

Clicking the different tabs on top of the heat map will show you different stats with boxes colored by price percent increase.

The colors are assigned by the current min price vs the average price:
* Blue for out of stock
* Bright green for `spiking prices` over a 66% price increase
* Dark green for `increasing prices` 15% to 66% increase
* Yellow for `stable prices` around -15% to 15%
* Dark red for `decreasing prices` -15% to -66%
* Bright red for `crashing prices` under -66%

Market Overview shows you the best items overall that earned the most gil:

![image](https://user-images.githubusercontent.com/17516896/225380594-5702336d-ab0a-4e73-ba41-652b09df21e3.png)

A price percent increase is best for seeing which items are the best to trade, it favors out of stock which appears the largest

![image](https://user-images.githubusercontent.com/17516896/225384652-169a6ea1-c586-4a70-b9f8-87b3289c0165.png)

This is most useful when using the `Sort Results by` option for the [Highest Price Percent Increases Weekly](https://saddlebagexchange.com/ffxiv/marketshare?timePeriod=168&salesAmount=3&averagePrice=10000&filters=0&sortBy=percentChange), which shows dozens of high value out of stock items or items at such a high price they might as well be out of stock.

![image](https://user-images.githubusercontent.com/17516896/225385163-50774980-edfb-43d3-b702-e818064225bf.png)

Purchase amount shows you which items had the most individual sales (i.e. most people clicking buy on them) (top selling Materia often appear here)

![image](https://user-images.githubusercontent.com/17516896/225391244-03873838-3bb6-4676-bef2-471519e76b5b.png)

Quantity sold shows the items sold the most bulk in the largest stacks (crystals appear here when you set a low price as they sell in stacks of 9999)

![image](https://user-images.githubusercontent.com/17516896/225391952-c11a99ec-62a8-4c60-8fac-13b804ee89e5.png)

The other tabs will show the top median/average prices but you can get the same info from the statistics table below




