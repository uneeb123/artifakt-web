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
    return (
      <div id="gradient" className="Login-background container-fluid">
        <div className="row justify-content-center">
          <div className="Login-box col-8">
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
