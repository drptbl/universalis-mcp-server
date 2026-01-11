# swagger

[View the full api and definitions on our swaggerhub page](https://app.swaggerhub.com/apis/SaddlebagExchange/ffxiv/)

[converted with this tool](https://kevinswiber.github.io/postman2openapi/)

# curl examples

Using DNS record. Note `http` must be used with http://api.saddlebagexchange.com, https doesnt work because of some cloudflare stuff
```
$ curl -s -X POST \
    http://api.saddlebagexchange.com/api/seller/ \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d '{
        "item_id": 4745,
        "home_server": "Midgardsormr",
        "retainer_name": "Kainin"
    }' | jq .

{
  "seller_id": "590362b2eb930741fc65059060033d10e6415743f6e677ec822ba6b2074bf8d4"
}
```

another to try

```
curl -s -X POST \
    http://api.saddlebagexchange.com/api/scan/ \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d '{
        "preferred_roi": 99, 
        "min_profit_amount": 10000,
        "min_desired_avg_ppu": 10000,
        "min_stack_size": 1,
        "hours_ago": 168,
        "min_sales": 2,
        "hq": false,
        "home_server": "Yojimbo",
        "filters": [0],
        "region_wide": false,
        "include_vendor": false,
        "show_out_stock": true
    }' | jq .
```

curl example with ip

```
$ curl -s -X POST \
    http://1.2.3.4/api/seller/ \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d '{
        "item_id": 4745,
        "home_server": "Midgardsormr",
        "retainer_name": "Kainin"
    }' | jq .

{
  "seller_id": "590362b2eb930741fc65059060033d10e6415743f6e677ec822ba6b2074bf8d4"
}
```

# Postman examples

You can also run this with postman instead of curl 

<img width="619" alt="image" src="https://user-images.githubusercontent.com/17516896/190919261-cb541bdc-70e3-4773-b2d5-94275bac3da0.png">

<img width="611" alt="image" src="https://user-images.githubusercontent.com/17516896/190919290-312a9998-1951-451d-b031-f26e87fd94d1.png">


# POST Content

## FFXIV

### Scan

http://api.saddlebagexchange.com/api/scan

```json
{
    "preferred_roi": 50, 
    "min_profit_amount": 10000,
    "min_desired_avg_ppu": 10000,
    "min_stack_size": 1,
    "hours_ago": 24,
    "min_sales": 4,
    "hq": false,
    "home_server": "Famfrit",
    "filters": [0],
    "region_wide": false,
    "include_vendor": false,
    "show_out_stock": true,
    "universalis_list_uid": ""
}
```

### History
http://api.saddlebagexchange.com/api/history
```json
{
    "item_id": 36109,
    "home_server": "Midgardsormr",
    "initial_days": 7,
    "end_days": 0,
    "item_type": "all"
}
```
### Listing
http://api.saddlebagexchange.com/api/listing
```json
{
    "item_id": 36109,
    "home_server": "Midgardsormr",
    "initial_days": 30,
    "end_days": 0
}
```

### export

http://api.saddlebagexchange.com/api/export

api post body

```json
  {
    "home_server": "Famfrit", 
    "export_servers": ["Lamia","Seraph"],
    "item_ids": [33275,4745],
    "hq_only": false
  }
```

### ffxiv market share

http://api.saddlebagexchange.com/api/ffxivmarketshare/

```json
{
    "server": "Famfrit",
    "time_period": 24,
    "sales_amount": 2,
    "average_price": 10000,
    "filters": [0]
}
```

### Allagan Tools data parsing

http://api.saddlebagexchange.com/api/parseallagan

```json
{
    "server": "Famfrit",
    "allagan_json_data": $DATA_COPIED_FROM_ALLAGAN_TOOLS
}
```
### Self purchase 

http://api.saddlebagexchange.com/api/selfpurchase


```json
{
    "server": "Famfrit",
    "player_name": "Aere Noctum"
}
```