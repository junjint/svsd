# Apple integrations — actual use and limits

Neither requested Apple server was already registered among available Codex tools/configured MCP servers. No global configuration, credentials, accounts or permissions were changed.

**Apple Docs MCP:** actually launched `@kimsungwhee/apple-docs-mcp@1.0.26` through a temporary local stdio JSON-RPC client. Initialization and `tools/list` succeeded. `get_apple_doc_content` returned ActivityKit Live Activities, UserNotifications authorization, MapKit JS, SwiftUI NavigationStack, presentation detents, LongPressGesture, WidgetKit and UIKit safeAreaInsets documentation. This was a local MCP research session, not a permanently registered Codex connection. The client is retained in this chat's `work/apple-docs-client.mjs`.

Research informed the separation of notification banners from active-task Live Activities, tap-versus-hold behavior, task completion, contextual permission choices, sheet dismissal, root/detail navigation and reserved safe areas. Apple HIG pages were also read directly.

**Apple Maps MCP:** its documented Apify endpoint returned HTTP 401 `invalid_token`, requiring an Apify bearer token. No token was configured. Business tools could not be listed/called; no live enrichment or successful connection is claimed. The failed connection was not repeatedly retried.

**MapKit JS:** no Maps token was available, so it was not loaded. The isolated Leaflet renderer can be replaced by a future MapKit adapter without changing journey state or screens. Apple Maps MCP is business-search data, not a renderer or routing engine.

## Environment

**No environment variables/API keys are required.** Historical repository `.env` values are unused by the new app. OpenStreetMap tiles are optional network content; the local vector map remains functional if tiles fail.

Future integrations, not implemented: a server-side Apify secret (for example `APIFY_API_TOKEN`) for business search, and a backend MapKit token endpoint with Apple account/team/key configuration. Never put an Apify secret or Apple private signing key in frontend code. The renderer would consume only its authorized Maps token.

The prototype cannot deliver real iOS push notifications, create ActivityKit/WidgetKit surfaces, access background GPS, or extend Apple Maps. Those system experiences are faithfully simulated within the phone.

## Consulted sources

- [Apple Docs MCP](https://github.com/kimsungwhee/apple-docs-mcp), [Apple Maps MCP](https://github.com/johnisanerd/apple-maps-mcp)
- [Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities), [Notification permissions](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
- [MapKit JS](https://developer.apple.com/documentation/mapkitjs), [NavigationStack](https://developer.apple.com/documentation/swiftui/navigationstack)
- [Presentation detents](https://developer.apple.com/documentation/swiftui/view/presentationdetents(_:)), [Long press](https://developer.apple.com/documentation/swiftui/longpressgesture)
- [WidgetKit](https://developer.apple.com/documentation/widgetkit), [Safe areas](https://developer.apple.com/documentation/uikit/uiview/safeareainsets)
- [HIG Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [Leaflet](https://leafletjs.com/reference.html), [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/), [Expo Router SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/)
