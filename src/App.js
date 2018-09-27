import React, { Component } from 'react';
import { PropagateLoader } from 'react-spinners';

import Web3 from 'web3';
import logo from './logo/logo_white.svg';
import './App.css';
import NFTABI from './contracts/nft.abi';
import contractAddresses from './contracts/addresses';

const INFURA_WS = "wss://mainnet.infura.io/ws";
const apiKey = "11IBD3K48I6ZXIT86ZC17YH3XYZJCAURID";
const etherBaseUrl = "http://api.etherscan.io/api?";
const cryptoKittyBaseUrl = "http://api.cryptokitties.co/kitties/";

const kittySaleAddress = '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C';
const kittySiringAddress = '0xC7af99Fe5513eB6710e6D5f44F9989dA40F27F26';
// const kittyCoreAddress = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

class KittyProcessor {
  constructor(accountAddress) {
    this.accountAddress = accountAddress;
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
      let eventProvider = new Web3.providers.WebsocketProvider(INFURA_WS);
      eventProvider.on('error', e => reject(e));
      eventProvider.on('end', e => reject(e));

      let web3 = new Web3(eventProvider);
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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metamaskExists: false,
      metamaskLoggedIn: false,
      metamaskListening: false,
      account: null,
      loading: true,
      kitties: {
        available: [],
        siring: [],
        past: [],
      },
    };
    if (Web3.givenProvider) {
      this.web3 = new Web3(Web3.givenProvider);
    } else {
      this.web3 = null;
    }
    this.eventProvider = new Web3.providers.WebsocketProvider(INFURA_WS);
    this.eventProvider.on('error', e => console.error('WS Error', e));
    this.eventProvider.on('end', e => console.error('WS End', e));
    this.web3Infura = new Web3(this.eventProvider);
  }

  componentWillMount() {
    if (this.web3) {
      this.setState({metamaskExists: true});
    }
    this.web3.eth.getAccounts((err, accounts) => {
      if (err !== null) console.error("An error occurred: "+err);
      else if (accounts.length === 0) {
        console.log("User is not logged in to MetaMask");
        this._startListeningForMetamaskLogIn();
      }
      else {
        console.log("User is logged in to MetaMask");
        this.setState({
          metamaskLoggedIn: true,
          account: accounts[0]
        });
        this._loadKittyInfo();
      }
    });
  }

  shouldComponentUpdate() {
    this._removeListeningForLogIn();
    return true;
  }

  componentDidMount() {
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
            }
          });
        }).catch(e => console.error(e));
      }).catch(e => console.error(e));
    }).catch(e => console.error(e));
  }

  _loadKittyInfo = () => {
    this.kittyProcessor = new KittyProcessor(this.state.account);
    this.kittyProcessor._allKittiesEverBought()
      .then((ids) => {
        this.kittyProcessor._getKittyPortfolio(ids)
          .then((sortedIds) => {
            this._constructKitties(sortedIds);
          }).catch(e => console.error(e));
      }).catch(e => console.error(e));
  }

  _removeListeningForLogIn = () => {
    if (this.state.metamaskListening) {
      if (this.state.metamaskLoggedIn) {
        clearInterval(this.interval);
      }
    }
  }

  // only if metamask exists, not already logged in and not listening
  _startListeningForMetamaskLogIn = () => {
    if (this.state.metamaskExists) {
      if (!this.state.matamaskLoggedIn && !this.metamaskListening) {
        this.interval = setInterval(this._checkMetamaskLoggedIn, 1000);
        this.setState({
          metamaskListening: true
        });
      }
    }
  }

  _checkMetamaskLoggedIn = () => {
    this.web3.eth.getAccounts((err, accounts) => {
      if (err !== null) console.error("An error occurred: "+err);
      if (accounts.length !== 0) {
        console.log("User is logged in to MetaMask");
        this.setState({
          metamaskLoggedIn: true,
          account: accounts[0]
        });
        this._loadKittyInfo();
      }
    });
  }

  render() {
    let loggedIn = this.state.metamaskLoggedIn;
    let connected = this.state.metamaskExists;
    let loading = this.state.loading;
    let mmText = "Metamask not found";
    let bodyInfo = (
      <p className="App-info">
        {mmText}
      </p>
    );

    if (connected) {
      if (loggedIn) {
        if (loading) {
          bodyInfo = (
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
          mmText = "Connected to Metamask";
        }
      } else {
        mmText = "Please log on to Metamask";
      }
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <div className="App-body">{bodyInfo}</div>
      </div>
    );
  }
}

export default App;
