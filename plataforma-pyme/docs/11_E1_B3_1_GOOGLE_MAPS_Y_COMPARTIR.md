# E1-B3.1 — Google Maps links and copy locations

**Status:** implemented in GitHub main; build earrings, lint and computer browser check.
**Reference:** original file `Ubicaciones.html`especially form with Google Maps Link, cards with View in Google Maps and option Share Complete Sheet.
**Scope:** location of each DEMO company, without automatic geocoding, API Key or Google Maps iframe.

## Capacity implemented

1. Dentro de `/b/:businessId/ubicaciones`, create or edit location with a **optional Google Maps link**.
2. The form allows **Search this address in Google Maps**: opens an official search URL built with new tab `https://www.google.com/maps/search/?api=1&query=...`. If there is no address, open the Maps home page.
3. The user can choose a location in Google Maps and use **Share → Copy Link**. When you return to the form, paste that link, save it and then appear **See location in Google Maps**.
4. If it was loaded **only one address**The card says **Search address in Google Maps**. The search is not confused with a verified coordinate.
5. **Copy Location** voluntarily copy the company name, location name, entered reference and a link to Maps. If the browser rejects the clipboard, it presents a text area for manual copying.
6. If there is no link or address, the Copy button is not enabled.
7. Validation: only HTTPS and Google Maps hosts/paths (Google Web maps and short links) `maps.app.goo.gl` y `goo.gl/maps`), without credentials or non-standard ports. Reject other sites, `javascript:` or links open to `google.com/url`.
8. The model `DemoLocation` incorporates `mapUrl`; `LocationInput`, high/editing and loading of `localStorage` are compatible with existing locations that do not have this field. The persistence key does NOT change: `asistente-pyme.e1a2.demo.v1`.
9. All URLs of stored content are revalidated when you open them. There is no automatic browsing to third parties or posting of the address; copying only happens when you press the button.
10. The scope is still `businessId`. No places or addresses of WALOS are integrated as pre-determined of other companies.

## What doesn't he do?

- It does not allow you to click directly on a map inside Orbit and automatically obtain coordinates.
- It does not verify that an address corresponds to a local or that a short link points to the location the user wants.
- It does not record latitude, longitude or Place ID; if precision is required for deliveries or delivery, that model must be designed and Google Places/Maps JavaScript API, costs and usage restrictions evaluated.
- It does not send WhatsApp messages or mail or publish the location; it only copies text on demand.
- Do not embed counterfeit images of maps or photographs from old HTML.

## Files

- `frontend/src/data/demo/mapsLinks.ts`: Secure standardization, Google Maps search and copy text.
- `frontend/src/data/demo/demoStore.ts`: property `mapUrl` and load compatible with saved status.
- `frontend/src/features/locations/LocationsPage.tsx`: field, search, links, copy/fallback.
- `frontend/src/App.css`: presentation and response.
- `frontend/tests/maps-links.test.mjs`: tests unitarios de las URLs.
- `frontend/package.json`: script `test:maps`.

## Validation required — not executed on this delivery

From `plataforma-pyme/frontend`:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:maps
npm.cmd run dev
~~~

| ID | Route | Expected |
|---|---|---|
| MAPS-01 | Edit location previously created without mapUrl | The fields above intact, new empty link |
| MAPS-02 | Paste official link `https://maps.app.goo.gl/...`, save and reload F5 | Persisting link; open Google Maps when you press it |
| MAPS-03 | Enter Fictite address without link | Card says "Search address in Google Maps" |
| MAPS-04 | Copy Location with Shared Link | Copy name and shared URL |
| MAPS-05 | Copy Location with Address Only | Text expressly indicates that it is an unverified search |
| MAPS-06 | Link `javascript:`, `http:` or another domain | Rejection and message, previous data intact |
| MAPS-07 | Business A with link, alternate to B, save different, F5 | No cross-border crossings |
| MAPS-08 | Browser without clipboard permission | Editable text shown for manual selection/copy only |
| MAPS-09 | 390px display | Accessible overflow control and link |
| MAPS-10 | Update version from old E1-B3 | No loss of profile, companies, positions or previous locations |

## External reference

Official documentation of Google Maps URLs, `api=1` for universal searches and URLs, without API key: https://developers.google.com/maps/documentation/urls/get-started

## Future developments

The interactive map with bookmark selection, accurate coordinate storage and address checking should be incorporated only if the use of the product requires it. For now shared URLs resolve the case of use directly, without external payment services or automatic data exposure.
