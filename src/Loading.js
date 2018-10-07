import React, { Component } from 'react';
import { PropagateLoader } from 'react-spinners';

import logo from './logo/logo_black.svg'; 

export default class Loading extends Component {
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
            </span>
          </div>
        );

      } else {
        info = (
          <div className="Login-issue">
            <i className="fa fa-exclamation-circle Login-red"></i>
            <span className="Login-red">
              {"Please log on to Metamask"}
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
              <div className="col-7 Login-info-col">
                {this._registerInfo()}
              </div>
              <div className="col-5 d-flex justify-content-center align-items-center">
                <PropagateLoader
                  sizeUnit={"px"}
                  size={10}
                  color={'#555'}
                  loading={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
