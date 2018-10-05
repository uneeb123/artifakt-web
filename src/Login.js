import React, { Component } from 'react';

export default class Login extends Component {
  render() {
    let connected = this.props.connected;
    let loggedIn = this.props.loggedIn;
    let info;

    if (connected) {
      if (loggedIn) {
        info = "Connected to Metamask";
      } else {
        info = "Please log on to Metamask";
      }
    } else {
      info = "Metamask not found. Please download Metamask.";
    }

    return (
      <div id="gradient" className="App-background">
        {info}
      </div>
    );
  }
}
