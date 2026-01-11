## Universalis Discord Webhooks

Universalis offers Discord webhooks that allow you to receive simple price and quantity-based alerts on your home server in a Discord channel you own.

For more user-friendly alerts with additional options designed to help you earn more gil, check out the [Saddlebag Exchange](https://saddlebagexchange.com/) alerts in their [Discord server](https://discord.gg/836C8wDVNq).

### Available Alerts

- [Undercut Alerts](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Undercut-Alerts---Alpha-version)
- [Price Sniper Alerts](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Price-Sniper-and-Item-Price-Alerts)
- [Sale Alerts](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/FFXIV-Sale-Alerts)
- [Shortage Quantity Alerts](https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Price-Sniper-and-Item-Price-Alerts)

## Example Alerts

![Example Alert](https://user-images.githubusercontent.com/17516896/229619099-6b995011-3a3e-4c9e-84b3-83c6969f9f7f.png)

## Setup Instructions

Follow these steps to set up your alerts:

1. **Login to Universalis with Discord:**

   ![Login Screenshot](https://user-images.githubusercontent.com/17516896/229612628-dd40f9a7-da61-4f96-b604-e3da0f0f8d66.png)

2. **Search for Your Favorite Items:**

   ![Search Items Screenshot](https://user-images.githubusercontent.com/17516896/229612942-00d03385-a08f-46f0-8f41-c5421c4d1ce8.png)

3. **Create a Discord Webhook:**

   Create a webhook on a Discord channel you manage or have admin permissions over. Check out the [Discord documentation for setting up webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) if you need assistance.

4. **Select the Alerts Button:**

   Click the Alerts button on an item you wish to monitor and create a new alert.

   ![Select Alerts Screenshot](https://user-images.githubusercontent.com/17516896/229613136-d7547644-8574-4be7-b828-51a00a4df32a.png)

   ![Alert Options Screenshot](https://user-images.githubusercontent.com/17516896/229613217-346c130b-de8c-4a9c-921c-5efc60fd0334.png)

5. **Enter Your Alert Triggers:**

   Customize your alert with the following options:

   - **Name:** Give your alert a name.
   - **World:** Select which server you wish to monitor.
   - **Filter:** Specify if you want alerts only for HQ items. Leave blank for all qualities.
   - **Using:** Choose between `Unit Price`, `Total`, or `Quantity` to set which metrics trigger alerts.
   - **Calculate:** Choose `Minimum`, `Maximum`, or `Average` based on the metric selected in the `Using` field.
   - **Compare:** Set `Result is greater than` or `Result is less than` to alert when the calculated value meets your criteria.
   - **Discord Webhook:** Paste your Discord webhook URL from step 3.

   ![Alert Triggers Screenshot](https://user-images.githubusercontent.com/17516896/229616025-f7f23e2a-004a-45b5-970c-3a6ecf31f566.png)