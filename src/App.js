import React, { Component } from 'react';

import Web3 from 'web3';
import './App.css';

import MainApp from './MainApp';
import Login from './Login';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metamaskExists: false,
      metamaskLoggedIn: false,
      metamaskListening: false,
      authenticated: false,
      account: null,
    };
    if (Web3.givenProvider) {
      this.web3 = new Web3(Web3.givenProvider);
    } else {
      this.web3 = null;
    }
  }

  componentWillMount() {
    if (this.web3) {
      this.setState({metamaskExists: true});
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
        }
      });
    }
  }

  shouldComponentUpdate() {
    this._removeListeningForLogIn();
    return true;
  }

  componentDidMount() {
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
      }
    });
  }

  render() {
    let connected = this.state.metamaskExists;
    let loggedIn = this.state.metamaskLoggedIn;
    let authenticated = this.state.authenticated;

    let body;
    if (connected && loggedIn && authenticated) {
      body = (<MainApp account={this.state.account}/>);
    } else {
      body = (<Login account={this.state.account} connected={connected} loggedIn={loggedIn}/>);
    }

    return (
      <div>
        {body}
      </div>
    );
  }
}

export default App;
