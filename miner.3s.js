#!/usr/bin/env /usr/local/bin/node
const bitbar = require('bitbar');
const request = require('request');
const _ = require('lodash');

function getJSONpart(body) {
  const jsonPart = JSON.parse(body.match(/\{.+\}/)[0]);
  return jsonPart.result;
}

function getHashrate(hashString, decimalPlace = 2) {
  const hashArray = hashString.split(';');
  let totalHashRate = 0;
  let avgHashRate;
  _.each(hashArray, (hash) => {
    totalHashRate+= parseInt(hash);
  })

  avgHashRate = parseFloat(totalHashRate / hashArray.length / 1000).toFixed(decimalPlace);
  totalHashRate = parseFloat(totalHashRate / 1000).toFixed(decimalPlace);
  return {
    totalHashRate, avgHashRate
  }
}

function getMinerByUrl(url, name) {
  return new Promise((resolve, reject) => {
    request(url, function(err, response, body) {
      if(err) {
        reject(err);
      }
      body = getJSONpart(body);
      hashData = getHashrate(body[3]);
      const data = {
        totalHashRate:hashData.totalHashRate,
        avgHashRate: hashData.avgHashRate,
        name
      }
      resolve(data);
    });
  })
}

const MINERS = [
  {
    name: 'Miner1',
    url: 'http://192.168.0.11:3333'
  },
  {
    name: 'Miner2',
    url: 'http://192.168.0.12:3333'
  }
];

function getMiners(miners) {
  const promises = [];
  _.each(miners, (miner) => {
    promises.push(getMinerByUrl(miner.url, miner.name));
  })
  return Promise.all(promises).then((miners) => {
    let totalHashRate = 0;
    let avgHashRate = 0;
    _.each(miners,(miner) => {
      totalHashRate += miner.totalHashRate;
    })
    avgHashRate = totalHashRate / miners.length;
    return {
      total: {
        totalHashRate,
        avgHashRate
      },
      miners
    }
  });
}

getMiners(MINERS).then((body) => {
  const bitbarArray = [];
  let text = '';
  _.each(body.miners, (miner, i, arr) => {
    text+= miner.name+': ' + miner.totalHashRate + 'mh/s';
    if(i !== arr.length -1) {
      text += ' - '
    }
  })
  bitbarArray.push(text);

  bitbar(bitbarArray);
});

