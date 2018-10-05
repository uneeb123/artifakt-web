import React, { Component } from 'react';

import logo from './logo/logo_black.svg'; 

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

  _registerInfo = () => {
    return (
      <div>
        <img src={logo} className="Login-logo" alt="logo" />
        <ul className="list-unstyled">
          <li className="Login-info-li">discover elite players</li>
          <li className="Login-info-li">find rare collectibles</li>
          <li className="Login-info-li">power-up your inventory</li>
        </ul>
      </div>
    );
  }

  _registerForm = () => {
    let allow = this.props.connected && this.props.loggedIn;

    return (
      <form onSubmit={this._handleSubmit}>
        <div className="form-group row">
          <label className="col-sm-3 col-form-label d-flex justify-content-start align-items-center">handle</label>
          <div className="col-sm-9">
            <input type="text" className="form-control"
              id="inputHandle" value={this.state.handle} disabled={!allow}
              onChange={this._handleHandle} placeholder="enter handle" />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-3 col-form-label d-flex justify-content-start align-items-center">email</label>
          <div className="col-sm-9">
            <input type="email" className="form-control"
              id="inputEmail" value={this.state.email} disabled={!allow}
              onChange={this._handleEmail} placeholder="enter email" />
            <small id="emailHelp" className="form-text text-muted">{"We'll never share your email with anyone else."}</small>
          </div>
        </div>
        <div className="form-group row">
          <div className="col-sm-3"></div>
          <div className="col-sm-9 d-flex justify-content-start">
            <input type="submit" disabled={!allow} className="btn btn-primary Login-register-btn" value="Register" />
          </div>
        </div>
      </form>
    );
  }

  render() {
    let connected = this.props.connected;
    let loggedIn = this.props.loggedIn;
    let info;

    if (connected) {
      if (loggedIn) {
        info = (
          <div className="Login-issue-green">
            <i className="fa fa-check-circle Login-green"></i>
            <span className="Login-green">
              {"Connected to Metamask"}
            {info}
            </span>
          </div>
        );

      } else {
        info = (
          <div className="Login-issue">
            <i className="fa fa-exclamation-circle Login-red"></i>
            <span className="Login-red">
              {"Please log on to Metamask"}
            {info}
            </span>
          </div>
        );
      }
    } else {
      info = (
          <div className="Login-issue">
            <i className="fa fa-exclamation-circle Login-red"></i>
            <span className="Login-red">
              {"Metamask not found. Download Metamask extension to get started."}
            {info}
            </span>
          </div>
        );

    }

    return (
      <div id="gradient" className="Login-background container-fluid">
        <div className="row justify-content-center">
          <div className="Login-box col-8">
            {info}
            <div className="row">
              <div className="col">
                {this._registerInfo()}
              </div>
              <div className="col">
                {this._registerForm()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
