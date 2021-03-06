import React, { Component } from 'react';
import { PropagateLoader } from 'react-spinners';

import Web3 from 'web3';

import NFTABI from './contracts/nft.abi';
import contractAddresses from './contracts/addresses';

// FIXME Use infura instead of MetaMask to speed up
// const INFURA_WS = "wss://mainnet.infura.io/ws";
const apiKey = "11IBD3K48I6ZXIT86ZC17YH3XYZJCAURID";
const etherBaseUrl = "http://api.etherscan.io/api?";
const cryptoKittyBaseUrl = "http://api.cryptokitties.co/kitties/";
const cryptoKittyUrl = "https://www.cryptokitties.co/kitty/";

const kittySaleAddress = '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C';
const kittySiringAddress = '0xC7af99Fe5513eB6710e6D5f44F9989dA40F27F26';
// const kittyCoreAddress = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

class KittyProcessor {
  constructor(accountAddress) {
    if (accountAddress) {
      this.accountAddress = accountAddress;
    } else {
      console.error("Account address not initialized");
      this.accountAddress = null;
    }
    this.methodIds = {
      "0x454a2ab3": "bid"
    }
  }

  _functionDecoder = (data) => {
    // first 4 bytes is method with hex
    let methodIdHex = data.slice(0,10);
    let params = data.slice(10);
    // the rest is params of 32 bytes
    let param = parseInt(params, 16);
    return [methodIdHex, param];
  }

  _getKittyId = (input) => {
    let decodedValue = this._functionDecoder(input);
    if (this.methodIds[decodedValue[0]] === "bid") {
      return decodedValue[1];
    }
  }

  _getAllKittyIds = (txs) => {
    let ids = []
    for (let i=0; i<txs.length; i++) {
      ids.push(this._getKittyId(txs[i].input));
    }
    return ids;
  }

  _constructUrlForAllTxs = (address) => {
    let queryString = "module=account&action=txlist&address=" + 
      this.accountAddress + 
      "&startblock=0&endblock=999999999&sort=asc&apikey=" + apiKey;
    return etherBaseUrl + queryString;
  }

  _getAllTxs = (address) => {
    return new Promise((resolve, reject) => {
      let url = this._constructUrlForAllTxs(address);
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

  _txsToKittySale = (txs) => {
    let result = []
    for (let i=0; i<txs.length; i++) {
      if (txs[i].to.toLowerCase() === kittySaleAddress.toLowerCase()
        && txs[i].isError === "0") {
        result.push(txs[i]);
      }
    }
    return result;
  }

  _allKittiesEverBought = () => {
    return new Promise((resolve, reject) => {
      this._getAllTxs(this.accountAddress)
        .then((result) => {
          let resultingTxs = this._txsToKittySale(result);
          let kittyIds = this._getAllKittyIds(resultingTxs);
          resolve(kittyIds);
        }).catch(e => reject(e));
    });
  }

  _ownerOf = (kittyId) => {
    return new Promise((resolve, reject) => {
      /*
        let eventProvider = new Web3.providers.WebsocketProvider(INFURA_WS);
        eventProvider.on('error', e => reject(e));
        eventProvider.on('end', e => reject(e));

        let web3 = new Web3(eventProvider);
      */
      let web3 = new Web3(Web3.givenProvider);
      let contract = new web3.eth.Contract(NFTABI,
        contractAddresses["cryptokitties"], {
        });
      contract.methods.ownerOf(kittyId).call({from: this.accountAddress}).then((result) => {
        resolve(result);
      });
    });
  }

  _getKittyPortfolio = (kittyIds) => {
    return new Promise((resolve, reject) => {
      let result = {
        available: [],
        siring: [],
        past: [],
      };
      function forEachKitty(i, that) {
        if (i >= kittyIds.length) {
          resolve(result);
        }
        else {
          let kittyId = kittyIds[i];
          that._ownerOf(kittyId).then((owner) => {
            if (owner.toLowerCase() === that.accountAddress.toLowerCase()) {
              result.available.push(kittyId);
            } else if (owner.toLowerCase() === kittySiringAddress.toLowerCase()) {
              result.siring.push(kittyId);
            } else {
              result.past.push(kittyId);
            }
            forEachKitty(i+1, that);
          }).catch(e => reject(e));
        }
      }
      forEachKitty(0, this);
    });
  }

  _fetchKittyInfo = (kittyId) => {
    return new Promise((resolve, reject) => {
      let url = cryptoKittyBaseUrl + kittyId;
      fetch(url)
        .then(res => res.text())
        .then((body) => {
          let json = JSON.parse(body);
            resolve(json);
        }).catch(e => reject(e));
    });
  }
}



class CryptoKitty extends Component {
  _insertRow = (items) => {
    let result = [];
    for (let i=0; i<items.length; i++) {
      let item = items[i];
      let id = item.id;
      let gen = item.generation;
      let img = item.image_url;
      let bio = item.bio;
      result.push(
        <div className="col-6 col-md-4" key={i}>
          <a target="_blank" href={cryptoKittyUrl+id}>
          <div className="Kitty-card">
            <img src={img} alt={id} height={300} />
            <br />
            <p>Generation: {gen}</p>
            <br/>
            <p className="Kitty-bio">{bio}</p>
          </div>
          </a>
        </div>
      );
    }
    return result;
  }

  _insertAll = (items) => {
    let outcome = [];
    let numOfRows = Math.ceil(items.length/3);
    for (let i=0; i<numOfRows; i++) {
      let startIndex = i*3;
      let endIndex = i*3+3;
      let rowItems = this._insertRow(items.slice(startIndex, endIndex));
      let row = (
        <div className="row" key={i}>
          {rowItems}
        </div>
      );
      outcome.push(row);
    }
    return outcome;
  }

  render() {
    let available = this.props.available;
    let siring = this.props.siring;
    // let past = this.props.past;
    
    let availableContent;
    if (available.length > 0) {
      availableContent = (
        <div className="Kitty-available">
          <h2>Available</h2>
          {this._insertAll(available)}
        </div>
      );
    }
    let siringContent;
    if (siring.length > 0) {
      siringContent = (
        <div className="Kitty-siring">
          <h2>Siring</h2>
          {this._insertAll(siring)}
        </div>
      );
    }

    return (
      <div className="Kitty container-fluid">
        <h1>CryptoKitty</h1>
        {availableContent}
        {siringContent}
      </div>
    );
  }
}


export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      kitties: {
        available: [],
        siring: [],
        past: [],
      }
    }
  }

  componentWillMount() {
    this._loadKittyInfo();
  }

  _constructAvailableKitties = (availableIds) => {
    return new Promise((resolve, reject) => {
      var result = [];
      function constructKitty(i, that) {
        if (i >= availableIds.length) {
          resolve(result);
        } else {
          that.kittyProcessor._fetchKittyInfo(availableIds[i]).then((kittyData) => {
            result.push(kittyData);
            constructKitty(i+1, that);
          }).catch(e => reject(e));
        }
      }
      constructKitty(0, this);
    });
  }

  _constructSiringKitties = (siringIds) => {
    return new Promise((resolve, reject) => {
      var result = [];
      function constructKitty(i, that) {
        if (i >= siringIds.length) {
          resolve(result);
        } else {
          that.kittyProcessor._fetchKittyInfo(siringIds[i]).then((kittyData) => {
            result.push(kittyData);
            constructKitty(i+1, that);
          }).catch(e => reject(e));
        }
      }
      constructKitty(0, this);
    });
  }

  _constructPastKitties = (pastIds) => {
    return new Promise((resolve, reject) => {
      var result = [];
      function constructKitty(i, that) {
        if (i >= pastIds.length) {
          resolve(result);
        } else {
          that.kittyProcessor._fetchKittyInfo(pastIds[i]).then((kittyData) => {
            result.push(kittyData);
            constructKitty(i+1, that);
          }).catch(e => reject(e));
        }
      }
      constructKitty(0, this);
    });
  }

  _constructKitties = (sortedIds) => {
    this._constructAvailableKitties(sortedIds.available).then((availableKitties) => {
      this._constructSiringKitties(sortedIds.siring).then((siringKitties) => {
        this._constructPastKitties(sortedIds.past).then((pastKitties) => {
          this.setState({
            kitties: {
              available: availableKitties,
              siring: siringKitties,
              past: pastKitties
            },
            loading: false,
          });
          console.log("Kitties have been loaded");
        }).catch(e => console.error(e));
      }).catch(e => console.error(e));
    }).catch(e => console.error(e));
  }

  _loadKittyInfo = () => {
    this.kittyProcessor = new KittyProcessor(this.props.account);
    this.kittyProcessor._allKittiesEverBought()
      .then((ids) => {
        var t0 = performance.now();
        this.kittyProcessor._getKittyPortfolio(ids)
          .then((sortedIds) => {
            var t1 = performance.now();
            console.log("Took " + (t1 - t0) + " milliseconds to check " +
              "kitty ownership");
            this._constructKitties(sortedIds);
          }).catch(e => console.error(e));
      }).catch(e => console.error(e));
  }

  render() {
    let available = this.state.kitties.available;
    let siring = this.state.kitties.siring;
    let past = this.state.kitties.past;
    let loading = this.state.loading;
    let body;
    
    if (loading) {
      body = (
        <div className="App-loading container">
          <div className="row justify-content-center">
            <PropagateLoader
              sizeUnit={"px"}
              size={10}
              color={'#555'}
              loading={loading}
            />
          </div>
        </div> 
      );
    } else {
      body = (<CryptoKitty available={available} siring={siring} past={past} />);
    }

    return (
      <div>{body}</div>
    );
  }
}
