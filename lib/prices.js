'use strict'
const SteamCommunity = require('steamcommunity');
const community = new SteamCommunity();
const config = require('../config/config')
const request = require('request')
const Trade = require('./index')

//const API = 'https://api.steamapis.com/market/items'
//const saPrices = `${API}/${config.appID}?format=compact&compact_value=${config.SteamApisCompactValue}&api_key=${config.SteamApisKey}`
const nice = 'https://market-api.swap.gg/v1/pricing/lowest?appId=730';


Trade.prototype.getPrices = function getPrices(callback) {
    Trade.prototype.getSteamapis(3, (err, data) => { // 3 retries 
        if (err) {
            return this.getPrices(callback)
        }
        console.log('[!] Prices are updated.')
        return callback(data)
    })
    

}

Trade.prototype.getSteamapis = function getSteamapis(retries, callback) {
    request(nice, (error, response, body) => {
        const statusCode = (response) ? response.statusCode || false : false
        if(error || response.statusCode !== 200) {
            if(retries > 0) {
                retries--
                Trade.prototype.getSteamapis(retries, callback)
            } else {
                return callback({ error, statusCode })
            }
        } else {
            const noob = JSON.parse(body)
            const items = noob.result;
            var final =[];
            var map = new Map;
            var obj;
            for(var gg of Object.keys(items)){
                var rope= items[gg].price/100;
                map.set(gg, rope);
                obj = Object.fromEntries(map);
            }
            return callback(null,obj)
        }
    })
}