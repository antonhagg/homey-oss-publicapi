'use strict';

const Homey = require('homey');

class OSSResourceDevice extends Homey.Device {
  async onInit() {
    this.log('OSS resource device init', this.getName());
    // Device can store resource id and type in store
    this.resourceId = this.getSetting('resourceId');
  }
}

module.exports = OSSResourceDevice;
