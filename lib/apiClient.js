// Lightweight API helper that loads Swagger/OpenAPI at runtime and exposes helper methods
'use strict';

const Swagger = require('swagger-client');

module.exports = class APIClient {
  constructor({ swaggerUrl, authType, apiKey, bearerToken, logger }) {
    this.swaggerUrl = swaggerUrl;
    this.authType = authType || 'none';
    this.apiKey = apiKey;
    this.bearerToken = bearerToken;
    this.client = null;
    this.log = logger || (() => {});
  }

  async init() {
    this.log('APIClient.init loading', this.swaggerUrl);
    this.client = await Swagger({ url: this.swaggerUrl, requestInterceptor: req => {
      if (this.authType === 'apiKey' && this.apiKey) req.headers['x-api-key'] = this.apiKey;
      if (this.authType === 'bearer' && this.bearerToken) req.headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }});
    this.log('APIClient ready');
  }

  async call({ method, path, params, body }) {
    if (!this.client) await this.init();
    // Use swagger-client "execute" if available
    if (this.client && this.client.execute) {
      const op = { method, url: path, requestBody: body, parameters: params };
      const res = await this.client.execute(op);
      return res && res.body ? res.body : res;
    }
    throw new Error('Swagger client not initialized');
  }
};
