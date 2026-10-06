# Device location

Implemented for #15 under [spec #9](https://github.com/goncalvesjoao/gensai/issues/9).

The rightmost search-group button is "Use my location" in English and "現在地を取得" in Japanese. It has `type="button"` and works with the hazard menu open or closed. Opening the map does not acquire device location. Every activation asks `getCurrentPosition` for a fresh estimate with `maximumAge: 0`, a 10-second timeout and high accuracy. The button waits for the map selection listener to initialize, separately from basemap loading. Pending acquisition says "Finding your location…" or "現在地を取得中…" in a polite live region.

The shared Japan validation accepts a device position and selects it through the same map flow as manual selection. There is no cached-current-location centering action or separate current-location marker. A successful selected-place label and marker accessible name are "Selected location (device position)" or "選択した場所（端末の現在地）", followed by five-decimal coordinates.

A failed request replaces any existing selection with Tokyo at 35.68950, 139.69170 and centers the map there. The single selected marker's accessible name and selected-place label explicitly say "Selected location (Tokyo fallback)" or "選択した場所（東京への代替表示）". Tokyo is never stored or described as a detected current location. Choosing or correcting a point afterward replaces the fallback marker and removes the failure explanation. A newer acquisition or manual/address selection invalidates earlier device callbacks, so delayed results cannot overwrite the newer choice. Category state is untouched.

Exact failure wording is the cause below followed by one space and the common explanation.

| Outcome                                               | English cause                             | Japanese cause                               |
| ----------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| Permission denied                                     | Location permission was denied.           | 位置情報へのアクセスが許可されませんでした。 |
| Geolocation unavailable or unavailable-position error | Device location is unavailable.           | 端末の位置情報を取得できませんでした。       |
| Timeout                                               | Device location request timed out.        | 位置情報の取得がタイムアウトしました。       |
| Position outside Japan land validation                | Device location is outside land in Japan. | 端末の位置は日本の陸地ではありません。       |

English common explanation: "Showing Tokyo as a fallback, not your detected current location. You can choose or correct a place in Japan."

Japanese common explanation: "東京を代わりに表示しています。検出された現在地ではありません。日本の場所を選択・修正できます。"

## Verification

Run the production build and preview, then `node --test tests/browser/device-location.test.mjs`. The browser setup accepts the same `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `TEST_URL` and optional `SCREENSHOT_DIR` environment variables as the selected-location browser test. Browser geolocation is the controlled external boundary. Tests interact with the public URLs, visible controls and marker, with no map implementation calls.

On 2026-10-06 the first explicit-acquisition browser test failed before implementation because the button did not exist, then passed with the feature. Five device browser tests pass. Controlled Tokyo and Yonaguni successes, denial, unavailable-position error, timeout, Seoul and an absent geolocation API run in English/Japanese on phone/computer layouts and both application themes. They exercise menu states, keyboard Tab/Enter with visible focus, editable search input, correction after every outcome, delayed callbacks, resizing and one marker. Eight screenshots at `/tmp/gensai-spec-9/device-{en,ja}-{phone,computer}-{light,dark}.png` were inspected. The four existing selected-location browser scenarios, 17 Node tests, production build and ESLint also pass. The obsolete gradient assertion was removed with the historical gradient button; theme-variable assertions remain.
