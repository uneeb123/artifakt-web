import React, { Component } from 'react';
import Web3 from 'web3';
import logo from './logo/logo_white.svg';
import './App.css';
import NFTABI from './contracts/nft.abi';
import contractAddresses from './contracts/addresses';

const INFURA_WS = "wss://mainnet.infura.io/ws";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metamaskExists: false,
      metamaskLoggedIn: false,
      metamaskListening: false,
      account: null,
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
      else if (accounts.length === 0) console.log("User is not logged in to MetaMask");
      else {
        console.log("User is logged in to MetaMask");
        this.setState({
          metamaskLoggedIn: true,
          account: accounts[0]
        });
      }
    });
  }

  shouldComponentUpdate() {
    // stop checking if logged in
    if (this.state.metamaskListening) {
      if (this.state.metamaskLoggedIn) {
        clearInterval(this.interval);
      }
    }
    return true;
  }

  componentDidMount() {
    console.log(NFTABI);
    console.log(contractAddresses["cryptokitties"]);

    if (this.state.metamaskExists) {
      // if not logged in and not already listening, start listening
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
      }
    });
  }

  render() {
    let contract = new this.web3Infura.eth.Contract(NFTABI,
      contractAddresses["cryptokitties"], {
        from: this.state.account
      });
    contract.events.Transfer({filter: {tokenId: "888507"}, fromBlock: 0},
      (errors, events) => {
        console.log(events);
        console.log(errors);
      }
    );
    /*
    contract.events.Transfer({
      filter: {tokenId: "888507"},
      fromBlock: 0
    }, function(err, event) {
      console.log(err);
      console.log("Event");
      console.log(event);
    });
    */

    let loggedIn = this.state.metamaskLoggedIn;
    let connected = this.state.metamaskExists;
    let mmText = "Metamask not found";
    if (connected) {
      if (loggedIn) {
        mmText = "Connected to Metamask";
      } else {
        mmText = "Please log on to Metamask";
      }
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <div className="App-body">
          <p className="App-intro">
            {mmText}
          </p>
        </div>
      </div>
    );
  }
}

export default App;
