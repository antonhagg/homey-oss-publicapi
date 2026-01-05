// Homey app main file — generic client loader and flow/action implementation
'use strict';

const Homey = require('homey');
const Swagger = require('swagger-client');
const axios = require('axios');

class OSSApp extends Homey.App {
  async onInit() {
    this.log('OSS Public API app init');

    // Load settings or defaults
    this.settings = this.homey.settings;
    this.swaggerUrl = await this.settings.get('swaggerUrl') || 'https://publicapi.oss.no/swagger/v1.0/swagger.json';
    this.authType = await this.settings.get('authType') || 'none';
    this.apiKey = await this.settings.get('apiKey') || null;
    this.bearerToken = await this.settings.get('bearerToken') || null;

    this.client = null;
    await this._initClient().catch(err => this.log('Init client error', err.message));

    // Register generic flow action: invoke_api
    const cardAction = this.homey.flow.getActionCard('invoke_api');
    if (cardAction) {
      cardAction.registerRunListener(async (args, state) => {
        const { method, path, body, query } = args;
        try {
          const result = await this.invokeApi(method, path, query, body);
          this.log('invoke_api result', result && (typeof result === 'object' ? JSON.stringify(result).slice(0,400) : String(result)));
          return Promise.resolve(true);
        } catch (err) {
          this.log('invoke_api error', err && err.message);
          return Promise.reject(err.message || err);
        }
      });
    }

    this.homey.log('OSS Public API app initialized');
  }

  async _initClient() {
    this.log('loading swagger from', this.swaggerUrl);
    try {
      const client = await Swagger({ url: this.swaggerUrl, requestInterceptor: req => {
        // Apply authentication from settings
        if (this.authType === 'apiKey' && this.apiKey) {
          // Add as header x-api-key or Authorization — let user set header name in settings later
          req.headers['x-api-key'] = this.apiKey;
        }
        if (this.authType === 'bearer' && this.bearerToken) {
          req.headers['Authorization'] = `Bearer ${this.bearerToken}`;
        }
      }});
      this.client = client;
      this.log('swagger client ready');
    } catch (err) {
      this.log('Failed to load swagger client', err && err.message);
      throw err;
    }
  }

  async invokeApi(method, path, query, body) {
    if (!this.client) {
      await this._initClient();
    }
    // Use axios to call the endpoint directly using basePath from swagger
    const swagger = this.client.spec || (this.client && this.client.apis ? this.client.apis : null);
    const baseUrl = (this.client && this.client.spec && this.client.spec.schemes ? (this.client.spec.schemes[0] + '://') : '') + (this.client && this.client.spec && this.client.spec.host ? this.client.spec.host : '') + (this.client && this.client.spec && this.client.spec.basePath ? this.client.spec.basePath : '');

    // Normalize path
    const url = (path.startsWith('http') ? path : `${this.swaggerUrl.replace(/\\swagger[^/]*$/, '')}${path.startsWith('/') ? path : '/' + path}`);

    const headers = {};
    if (this.authType === 'apiKey' && this.apiKey) headers['x-api-key'] = this.apiKey;
    if (this.authType === 'bearer' && this.bearerToken) headers['Authorization'] = `Bearer ${this.bearerToken}`;

    const response = await axios({ method: method || 'get', url, headers, params: query || undefined, data: (body && body.length ? JSON.parse(body) : body) || undefined });
    return response.data;
  }
}

module.exports = OSSApp;
