'use strict'

const config = require('../config/config')
const request = require('request')
const async = require('async')
const Trade = require('./index')
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const client = new SteamUser();
const TradeOfferManager = require('steam-tradeoffer-manager');
const community = new SteamCommunity();

const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en'
});
const API_URL = 'http://localhost/?url=';

const MAX_RETRIES = 3
//const API_URL = 'https://api.steamapis.com/steam/inventory'

Trade.prototype.getInventory = function getInventory(steamID64, appID, contextID, callback, retries) {
    manager.getUserInventoryContents(steamID64,730, 2, true, (err, invens) => {
        if (err) {
            console.log(err);
        }else {
            //console.log(inven[0]);
            const inventory = {}

            if (invens) {
                async.forEach(invens, (inven, cbinven) => {
                    if (inven.tradable && inven.market_hash_name.indexOf('Souvenir') === -1) {
                        if (typeof inventory[inven.assetid] !== 'undefined') {
                            return true
                        }
                        const type = Trade.prototype.getItemType(inven.market_hash_name, inven.type)
                        const wear = Trade.prototype.getItemWear(inven.market_hash_name)
                        const inspect = Trade.prototype.getInspect(steamID64, inven.assetid, inven.actions)
                        //const l1 = 'https://steamcommunity-a.akamaihd.net/economy/image/'; 
                        inventory[inven.assetid] = inven
                        inventory[inven.assetid].item_type = type
                        inventory[inven.assetid].item_wear = wear
                        inventory[inven.assetid].inspect = inspect
                        inventory[inven.assetid].data = {
                            background: inven.background_color,
                            image: inven.icon_url,
                            tradable: inven.tradable,
                            marketable: inven.marketable,
                            market_hash_name: inven.market_hash_name,
                            type: inven.type,
                            color: inven.name_color,
                            }
                        
                    }
                    return cbinven()
                })
            }
            return callback(null, inventory);
        }
    });
}


Trade.prototype.getInventories = function getInventories(params, callback) {
    const inventories = {}
    async.each(params, (user, cb) => {
        Trade.prototype.getInventory(user.steamID64, user.appID, user.contextID, (err, data) => {
            inventories[user.id] = {}
            inventories[user.id] = {
                error: err,
                items: (!err) ? Object.keys(data).map(key => data[key]) : null,
            }
            cb()
        })
    }, () => {
        callback(inventories)
    })
}

Trade.prototype.getItemType = function getItemType(marketHashName, type) {
    if (marketHashName.indexOf('Key') !== -1) {
        return { value: 0, name: 'key' }
    }
    if (marketHashName.indexOf('★') !== -1) {
        return { value: 1, name: 'knife' }
    }
    if (
        type.indexOf('Classified') !== -1 ||
        type.indexOf('Contraband') !== -1 ||
        type.indexOf('Covert') !== -1
    ) {
        return { value: 2, name: 'rare_skin' }
    }
    if (
        type.indexOf('Consumer Grade') !== -1 ||
        type.indexOf('Base Grade') !== -1 ||
        type.indexOf('Graffiti') !== -1 ||
        type.indexOf('Sticker') !== -1 ||
        type.indexOf('Industrial Grade') !== -1
    ) {
        return { value: 4, name: 'misc' }
    }
    return { value: 3, name: 'weapon' }
}

Trade.prototype.getItemWear = function getItemWear(marketHashName) {
    if (marketHashName.indexOf('Factory New') !== -1) {
        return 'FN'
    }
    if (marketHashName.indexOf('Minimal Wear') !== -1) {
        return 'MW'
    }
    if (marketHashName.indexOf('Field-Tested') !== -1) {
        return 'FT'
    }
    if (marketHashName.indexOf('Well-Worn') !== -1) {
        return 'WW'
    }
    if (marketHashName.indexOf('Battle-Scarred') !== -1) {
        return 'BS'
    }
    return false
}
Trade.prototype.getInspect = function getInspect (steamID64, assetid, actions) {
    let inspectLink = null;                                           
    if (actions) {
        for (const a in actions) {
            if (actions[a].name.indexOf('Inspect') !== -1) {
                   inspectLink = actions[a].link
                   inspectLink = inspectLink.replace('%owner_steamid%', steamID64)
                   inspectLink = inspectLink.replace('%assetid%', assetid)
            }
        }
    }
    return inspectLink
}
