import React, { Component } from 'react';

import Web3 from 'web3';
import logo from './logo/logo_white.svg';
import './App.css';
import Profile from './Profile';

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
      }
    });
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
    let bodyInfo;

    if (connected) {
      if (loggedIn) {
        bodyInfo = (
          <p className="App-info">{"Connected to Metamask"}</p>
        );
      } else {
        bodyInfo = (
          <p className="App-info">{"Please log on to Metamask"}</p>
        );
      }
    } else {
      bodyInfo = (
        <p className="App-info">{"Metamask not found. Please download Metamask."}</p>
      );
    }
    let body;
    if (loggedIn) {
      body = (<Profile account={this.state.account}/>);
    } else {
      body = bodyInfo;
    }

    return (
      <div className="App container-fluid">
        <header className="Nav-header row">
          <div className="col Nav-button d-flex justify-content-center align-items-center">
            {"Discover"}
          </div>
          <div className="col Nav-button d-flex justify-content-center align-items-center">
            {"Profile"}
          </div>
          <div className="col-10 Nav-full">
            <img src={logo} className="Nav-logo" alt="logo" />
            <span className="Nav-beta">{"*preview"}</span>
          </div>
        </header>
        <div className="App-body row">
          {body}
        </div>
      </div>
    );
  }
}

export default App;
