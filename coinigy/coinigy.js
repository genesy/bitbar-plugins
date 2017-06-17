#!/usr/bin/env /usr/local/bin/node
const bitbar = require('bitbar');
const request = require('request');
const _ = require('lodash');
const fs = require('fs');

const config = require('../config/config');

const api_key= config.api_key;
const api_secret= config.api_secret;

const api_url="https://api.coinigy.com/api/v1/";

let PREVIOUS_BALANCE = 0;

function postReq(url, payload) {
  return new Promise((resolve, reject) => {
    return request.post({
      url: `${api_url}${url}`,
      form: payload,
      headers: {
        'x-api-key': api_key,
        'x-api-secret': api_secret
      }
    }, (err, httpResponse, body) => {
      if(err) {
        reject(err);
      }
      resolve(JSON.parse(body));
    });
  });
}

function saveToFile(data, filename) {
  fs.writeFile(__dirname + filename, data);
}

function getBalance(auth_id, decimalPlace = 5) {
  return postReq('refreshBalance', { auth_id }).then((body) => {
    let totalBtcValue = 0;
    let balances = [];
    _.each(body.data, (data) => {
      totalBtcValue += parseFloat(data.btc_balance);
      balances.push({
        name: data.balance_curr_code,
        btc: parseFloat(data.btc_balance),
        price: parseFloat(data.last_price)
      });
    });
    let gain = 0;
    let DATA = {}

    PREVIOUS_BALANCE = totalBtcValue;
    totalBtcValue = totalBtcValue.toFixed(decimalPlace);
    DATA = {
      total: totalBtcValue,
      balances,
      gain
    }
    return DATA;
  })
}



function showBitBar(balance, name) {
  const bitbarArray = [];
  bitbarArray.push({
    text: name + ': ' +  balance.total + 'b'
  });
  bitbarArray.push(bitbar.sep);

  _.each(balance.balances, function(balance) {
    bitbarArray.push({
      text: `${balance.name}: ${balance.btc} - ${balance.price}`,
      href: 'https://www.coinigy.com/main/markets/PLNX/BTC/' + balance.name
    });
  })
  bitbar(bitbarArray)
}

module.exports = function showBalance(options) {
  getBalance(options.auth_id, 3).then((balance) => {
    showBitBar(balance, options.name)
  });
}
