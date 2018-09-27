var Web3 = require('web3');
var abi = require('./nft.abi');
var addresses = require('./addresses');

const INFURA_WS = "wss://mainnet.infura.io/ws";

const methodIds = {
  "0x454a2ab3": "bid"
}

function functionDecoder(data) {
  // first 4 bytes is method with hex
  var methodIdHex = data.slice(0,10);
  var params = data.slice(10);
  // the rest is params of 32 bytes
  // TODO: take into account more than one
  var param = parseInt(params, 16);
  return [methodIdHex, param];
}

function getKittyId(input) {
  var x = functionDecoder(input);
  if (methodIds[x[0]] === "bid") {
    return x[1];
  }
}

function getAllKittyIds(txs) {
  var ids = []
  for (var i=0; i<txs.length; i++) {
    ids.push(getKittyId(txs[i].input));
  }
  return ids;
}

const fetch = require('node-fetch');

const apiKey = "11IBD3K48I6ZXIT86ZC17YH3XYZJCAURID";
const etherBaseUrl = "http://api.etherscan.io/api?";

function constructUrlForAllTxs(address) {
  var queryString = "module=account&action=txlist&address=" + 
    address + "&startblock=0&endblock=999999999&sort=asc&apikey=" + apiKey;
  return etherBaseUrl + queryString;
}

function getAllTxs(address) {
  return new Promise((resolve, reject) => {
    var url = constructUrlForAllTxs(address);
    fetch(url)
      .then(res => res.text())
      .then((body) => {
        var json = JSON.parse(body);
        if (json.status === "1") {
          resolve(json.result);
        } else {
          reject(json.status);
        }
      });
  });
}

function txsToKittySale(txs) {
  const kittySaleAddress = '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C';
  var result = []
  for (var i=0; i<txs.length; i++) {
    if (txs[i].to.toLowerCase() === kittySaleAddress.toLowerCase()
      && txs[i].isError === "0") {
      result.push(txs[i]);
    }
  }
  return result;
}

function allKittiesEverBought(address) {
  return new Promise((resolve, reject) => {
    var allTxs = []
    getAllTxs(address)
      .then((result) => {
        var resultingTxs = txsToKittySale(result);
        var kittyIds = getAllKittyIds(resultingTxs);
        resolve(kittyIds);
      }).catch(e => reject(e));
  });
}

function ownerOf(kittyId) {
  var eventProvider = new Web3.providers.WebsocketProvider(INFURA_WS);
  eventProvider.on('error', e => console.error('WS Error', e));
  eventProvider.on('end', e => console.error('WS End', e));

  var web3 = new Web3(eventProvider);
  var contract = new web3.eth.Contract(abi,
    addresses["cryptokitties"], {
    });
  contract.methods.ownerOf(kittyId).send().then((result) => {
    console.log(result);
  });
}

allKittiesEverBought("0x446252b54d626cf4192e5c74545761dfaf7e5a50")
  .then((ids) => {
    ownerOf(ids[0])
  }).catch(e => console.error(e));
