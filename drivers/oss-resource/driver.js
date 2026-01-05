'use strict';

const Homey = require('homey');

class OSSResourceDriver extends Homey.Driver {
  onInit() {
    this.log('OSS Resource driver init');
  }
}

module.exports = OSSResourceDriver;
