import React, { Component } from 'react';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      handle: "",
      email: "",
    };
  }

  _handleHandle = (event) => {
  }

  _handleEmail = (event) => {
  }

  _handleSubmit = (event) => {
    event.preventDefault();
  }

  _registerForm = () => {
    return (
      <form onSubmit={this._handleSubmit}>
        <div className="form-group">
          <label>Handle</label>
          <input type="text" className="form-control"
            id="inputHandle" value={this.state.handle}
            onChange={this._handleHandle} placeholder="Enter handle" />
        </div>
        <div className="form-group">
          <label>Email address</label>
          <input type="email" className="form-control"
            id="inputEmail" value={this.state.email}
            onChange={this._handleEmail} placeholder="Enter email" />
        </div>
        <input type="submit" className="btn btn-primary" value="Submit" />
      </form>
    );
  }

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
      info = "Metamask not found. Download Metamask extension to get started.";
    }

    return (
      <div id="gradient" className="Login-background container-fluid">
        <div className="row justify-content-center">
          <div className="Login-box col-6">
            <div className="Login-issue">
              <i className="fa fa-exclamation-circle Login-red"></i>
              <span className="Login-red">{info}</span>
            </div>
            {this._registerForm()}
          </div>
        </div>
      </div>
    );
  }
}
