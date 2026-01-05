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

Adding a device that shows API details

You can add a device that polls the API and shows a numeric value from the JSON response. The device uses the Homey `measure_power` capability to display a numeric value (this is a generic numeric capability used here for convenience).

To add such a device:

1. In the Homey Developer Tools, open the OSS Public API app and choose "Pair new device" (OSS Resource).
2. In the pairing form fill in:
   - Device name: a friendly name for the device.
   - Resource path: the API path to poll. This can be an absolute URL (starting with `http`) or a path relative to the swagger base (e.g. `/api/v1/devices/42`).
   - JSON key: the dot-notation path inside the JSON response to extract a numeric value (e.g. `data.latest.value`).
   - Poll interval: how often (in seconds) the device polls the API for new values.
3. Add the device. The device will be created and start polling. The numeric value extracted from the response will be shown in Homey using the `measure_power` capability.

Notes and limitations
- The current implementation expects a numeric value (number or numeric string) at the JSON key. If the value cannot be parsed as a number, it will be ignored. You can modify the driver code to map other value types or capabilities.
- Authentication: configure the app settings with the swagger URL and auth credentials (API key or bearer token) if the API requires authentication.
- The pairing page is intentionally minimal. You can expand it to show schema-driven fields or pick endpoints from the loaded swagger descriptor.

Next steps
- Add per-endpoint flow cards (actions/triggers) generated from the swagger.
- Map more JSON paths to different Homey capabilities and UI tiles.
- Improve error handling and expose last-poll status on the device card.
