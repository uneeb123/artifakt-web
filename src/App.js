import React, { Component } from 'react';

import Web3 from 'web3';
import './App.css';

import Loading from './Loading';
import MainApp from './MainApp';
import Login from './Login';

const serverUrl = "http://localhost:8000/";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metamaskExists: false,
      metamaskLoggedIn: false,
      metamaskListening: false,
      authenticated: false,
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
    this._registeredUser(account)
      .then((username) => {
        console.log("User is authenticated");
        this.setState({
          handle: username,
          authenticated: true,
          loading: false,
        });
      }).catch((e) => {
        console.log("User is not registered");
        this.setState({
          authenticated: false,
          loading: false,
        });
      });
  }

  _registeredUser = (account) => {
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
    let body = {
      username: handle,
      email: email,
    };
    console.log(body);
    fetch(serverUrl + "user/" + this.state.account, {
      method: 'POST',
      body:    JSON.stringify(body),
      headers: { 'Content-Type': 'application/json'}
    }).then((response) => {
      if (response.status === 200) {
        this.setState({
          authenticated: true
        });
      } else {
        console.error("Registration failed", response.status);
      }
    }).catch((error) => {
      console.error("Registration failed", error);
    });
  }

  render() {
    let loading = this.state.loading;
    let connected = this.state.metamaskExists;
    let loggedIn = this.state.metamaskLoggedIn;
    let authenticated = this.state.authenticated;

    let body;
    if (loading) {
      body = (
        <Loading 
          connected={connected} loggedIn={loggedIn}
        />
      );
    } else if (connected && loggedIn && authenticated) {
      body = (<MainApp account={this.state.account}/>);
    } else {
      body = (
        <Login account={this.state.account}
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
