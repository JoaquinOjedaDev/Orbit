# E1-B3.1 — Google Maps and share locations (without API)

**Status:** integrado en el frontend React de main. Build, lint y prueba manual local pendientes de confirmar.

## Reference

Original HTML of Locations provided by the team: forms with "Google Maps Link (URL)", "View in Google Maps" button and "Share Full Sheet" action. The screenshots provided serve as a presentation reference, not a data source.

## Decisions implemented

1. Al **create or edit a location**, address is still optional; added **Google Maps Link (optional)**. Paste a link copied from Google Maps. No need for API key.
2. The "Find this address in Google Maps" button opens a **search** of the address written using the public URL API of Google Maps. A search **is not a verified geolocation**: the user must confirm the place in Maps, share it and paste the link if you need an exact point.
3. On each card, with a saved link appears "View Location in Google Maps", if there is no link but yes address, it appears "Search Address in Google Maps", which **no** The Commission has not yet taken the view that the aid is an appropriate measure.
4. 'Copy Location' generates business name, place name, reference and link only after explicit action. Use browser clipboards, with selectable text failback if the browser does not allow.
5. Only HTTPS links to hosts and permitted paths are accepted from Google Maps. Insecure schemas, external URLs and embedded credentials are rejected. Reading localStorage, invalid links are ignored without discarding the location.
6. The property `mapUrl` se guarda **optionally** within each location, in the **same key and storage version** before; existing locations without `mapUrl` are loaded with empty chain. Businesses, profiles, business data and job functions are not deleted.
7. No iframe embedding or sending a background search to Google: Google Maps opens in new tab only if the person presses the link. The search button does share with Maps the address written on the search URL.
8. Addresses from private places are not automatically shared, and data sheets, phones or permissions are not copied. The user decides whether to paste the text copied into another application.

## Pending for Advanced Integration

El selector visual de un pin **dentro** platform, autocomplete search, address geocoding, embedded preview, sharing permissions and photos require a later decision about Google Maps Platform, terms of use, privacy and credentials/API. Do not fake a map with placemark images.

## Files

- `frontend/src/data/demo/mapsLinks.ts`: validation, search URL and text to copy.
- `frontend/src/data/demo/demoStore.ts`: `mapUrl` in DTO, commands and compatible persistent reading.
- `frontend/src/features/locations/LocationsPage.tsx`: link in form, open/search/copy from card.
- `frontend/src/App.css`: responsive styles.

## Cases to validate in VS Code

From `plataforma-pyme/frontend`: `git pull --ff-only origin main`, `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run dev`.

| Case | Procedure | Expected |
|---|---|---|
| MAP-01 | Create Location Without Address or Link | Saves; card indicates no map |
| MAP-02 | Complete only one fictitious address | Button of **search** in Maps, no bookmark confirmed |
| MAP-03 | Paste real link copied from Google Maps from a public place | Save, F5, open link in new tab |
| MAP-04 | Paste `https://maps.app.goo.gl/...` | URL supported if its formatting is valid |
| MAP-05 | Paste `javascript:...` or a Google copycat host | Visible error, not saved or opened |
| MAP-06 | Copy Location | Paste the name, test address and link into a notepad |
| MAP-07 | Deny clipboard in browser | Offers manually selectable text |
| MAP-08 | Change A→B and go back | Links and directions do not cross |
| MAP-09 | Load created locations before adding `mapUrl` | Previous data intact |
| MAP-10 | Reduce width to 390 px | Readable controls, no overflow |
| MAP-11 | Build + lint | No errors or warnings |

**Privacy Caution:** use fictitious data for testing. The user must confirm that the link corresponds to the correct site before sharing it.

External technical reference: https://developers.google.com/maps/documentation/urls/get-started and help from Google Maps on "Share or incorporate map".
