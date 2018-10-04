import React, { Component } from 'react';

import Profile from './Profile';
import Discover from './Discover';
import logo from './logo/logo_white.svg';

export default class MainApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bodyPointer: null,
    };
  }

  _activateDiscover = () => {
    this.setState({
      bodyPointer: "discover"
    });
  }

  _activateProfile = () => {
    this.setState({
      bodyPointer: "profile"
    });
  }

  render() {
    let bodyPointer = this.state.bodyPointer;
    let body;

    if (bodyPointer === "profile") {
      body = (<Profile account={this.props.account}/>);
    } else if (bodyPointer === "discover") {
      body = (<Discover />);
    } else {
      body = (<Discover />);
    }

    return (
      <div className="App container-fluid">
        <header className="Nav-header row">
          <div className="col Nav-button d-flex justify-content-center align-items-center"
            onClick={this._activateDiscover}>
            {"Discover"}
          </div>
          <div className="col Nav-button d-flex justify-content-center align-items-center"
            onClick={this._activateProfile}>
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
