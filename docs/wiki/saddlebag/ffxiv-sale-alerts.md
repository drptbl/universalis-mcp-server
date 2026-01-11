# Description

Our sale alerts monitor universalis for the items you are selling and will send an alert when an item has sold!

<img width="540" alt="image" src="https://user-images.githubusercontent.com/17516896/233164800-96bc86fa-fe26-4d72-aacf-442d1332506b.png">

# Setup

There are 2 ways to get sale alert data:

1. You can get this data using [Dalamund Plugins and the plugin Allagan Tools.](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Allagan-Tools-Inventory-Analysis#sale-and-undercut-alert-json-data) 
2. [The undercuts alert page also generates sale alerts](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Undercut-Alerts---Alpha-version#setup)

When using either search we will generate the sale alert data similar to the following:

```
{
  "item_ids":[21826,20744,35562,2731,7148,3023,35984,29682,7986,39378,2642,6460,4311,35573,6459,2236,30813,39391],
  "retainer_names":["my retainer","my other retainer","my other other retainer"],
  "server":"Famfrit"
}

```

This data includes:
- A list of the item ids of all items you are selling, or empty list to start.
- Your home server
- A list of your retainers names

We will search universalis in the listings of these items every 5 min and when we no longer find your retainer names in the listing data of an items you are selling then we will send an alert! This alert will contain the item name, universalis link and minimum price.

Note that there may be false positives when universalis is out of date and no longer finds your listings, this can happen whenever you pull your retainer off the marketboard to update prices.  So remember to always search the listings in game after updating item prices to insure universalis has the most up to date data.  

It also helps to turn off sale alerts when you are in your retainer menus.

# Discord bot

Give this to the discord bot to get alerts 

<img width="1032" alt="image" src="https://github.com/user-attachments/assets/7d71bfe0-93f4-43d3-a673-2fc8587c70bf" />

<img width="557" alt="image" src="https://github.com/user-attachments/assets/2d45674b-4740-4620-a55b-4b78ac795bd6" />

<img width="453" alt="image" src="https://github.com/user-attachments/assets/64dcc096-1a36-4d9b-820e-3e0e35ea3886" />

<img width="553" alt="image" src="https://github.com/user-attachments/assets/a275dcf3-5dd9-4530-9d0e-0ef96342e755" />


