# Homey OSS Public API

This repository contains a Homey SDK3 app that integrates with the OSS public API (https://publicapi.oss.no/swagger/v1.0/swagger.json).

The app provides:
- A generic API client that loads the provided OpenAPI/Swagger JSON at runtime.
- A generic "Invoke API" flow action to call any endpoint (method + path + body/params) using credentials stored in app settings.
- A device driver scaffold for representing OSS resources in Homey.

Installation
1. Clone this repository.
2. Install dependencies: `npm install`.
3. In Homey Developer Tools, upload the app or use `homey app run`.
4. In the app settings, set the Swagger URL (defaults to https://publicapi.oss.no/swagger/v1.0/swagger.json) and authentication details (API key / bearer token as required).

Notes
- This initial commit implements a full-API approach by loading the swagger descriptor at runtime and exposing a generic API call action. It is straightforward to add generated client wrappers or per-endpoint actions/triggers later.
