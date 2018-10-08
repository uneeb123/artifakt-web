import React, { Component } from 'react';

import Web3 from 'web3';
import './App.css';

import TermsOfService from './contracts/terms';
import Loading from './Loading';
import MainApp from './MainApp';
import Register from './Register';
import SignIn from './SignIn';

const ethUtil = require('ethereumjs-util')

const serverUrl = "http://localhost:8000/";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metamaskExists: false,
      metamaskLoggedIn: false,
      metamaskListening: false,
      authenticated: false,
      registered: false,
      account: null,
      handle: null,
      loading: true,
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
            account: accounts[0],
          });
          this._fetchUserDetails(accounts[0]);
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

  _fetchUserDetails = (account) => {
    this._previouslyRegisteredUser(account)
      .then((username) => {
        console.log("User is registered");
        this.setState({
          handle: username,
          registered: true,
          loading: false,
        });
      }).catch((e) => {
        console.log("User is not registered");
        this.setState({
          registered: false,
          loading: false,
        });
      });
  }

  _previouslyRegisteredUser = (account) => {
    return new Promise((resolve, reject) => {
      fetch(serverUrl + "user/" + account).then((response) => {
        if (response.status === 404) {
          reject();
        } else {
          response.json().then(json => {
            resolve(json.username);
          });
        }
      }).catch((err) => {
        console.log("Network error");
        console.error(err);
      });
    });
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
        this._fetchUserDetails(accounts[0]);
      }
    });
  }

  _registerUser = (handle, email) => {
    let from = this.state.account;
    let msg = ethUtil.bufferToHex(new Buffer(TermsOfService.text, 'utf8'));
    let params = [msg, from];
    let method = 'personal_sign';
    var that = this;

    // create signature
    this.web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, function (err, result) {
      if (err) return console.error(err);
      if (result.error) return console.error(result.error);
      let sig = result.result;
      console.log("Terms of service agreed");

      // now let's send the request
      let body = {
        username: handle,
        email: email,
        sig: sig,
      };
      console.log(body);
      fetch(serverUrl + "user/" + from, {
        method: 'POST',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json'}
      }).then((response) => {
        if (response.status === 201) {
          that.setState({
            authenticated: true
          });
        } else {
          console.error("Registration failed", response.status);
        }
      }).catch((error) => {
        console.error("Registration failed", error);
      });
    });
  }

  // TODO: Use EIP712 here
  _authenticateUser = () => {
    let timestamp = Date.now().toString();
    let msg = ethUtil.bufferToHex(new Buffer(timestamp, 'utf8'));
    
    let from = this.state.account;
    let params = [msg, from];
    let method = 'personal_sign';
    var that = this;

    this.web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, function (err, result) {
      if (err) return console.error(err);
      if (result.error) return console.error(result.error);

      let sig = result.result;
      let body = {
        sig: sig,
        msg: msg,
      };
      fetch(serverUrl + "auth/" + from, {
        method: 'POST',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json'}
      }).then((response) => {
        if (response.status === 200) {
          that.setState({ authenticated: true });
          console.log("User is authenticated");
        } else {
          console.error("User authenticated failed, problem with registration", response.status);
        }
      }).catch((error) => {
        console.error("Network failure", error);
      });
    });
  }

  render() {
    let loading = this.state.loading;
    let connected = this.state.metamaskExists;
    let loggedIn = this.state.metamaskLoggedIn;
    let authenticated = this.state.authenticated;
    let registered = this.state.registered;

    let body;
    if (loading) {
      body = (
        <Loading 
          connected={connected} loggedIn={loggedIn}
        />
      );
    } else if (connected && loggedIn && authenticated) {
      body = (<MainApp account={this.state.account}/>);
    } else if (connected && loggedIn && registered) {
      body = (
        <SignIn account={this.state.account}
          connected={connected} loggedIn={loggedIn}
          handler={this._authenticateUser}
        />
      );
    } else {
      body = (
        <Register account={this.state.account}
          connected={connected} loggedIn={loggedIn}
          handler={this._registerUser}
        />
      );
    }

    return (
      <div>
        {body}
      </div>
    );
  }
}

export default App;
