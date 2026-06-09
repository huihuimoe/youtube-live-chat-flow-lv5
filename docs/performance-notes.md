# Performance Notes

## Flow Message Overlay

Flow messages should stay inside a dedicated `.ylcf-container` mounted directly under `.html5-video-player`.

Rationale:

- `.html5-video-container` can have `height: 0` while the video itself is absolutely positioned with a real height.
- `.html5-video-player` has stable dimensions, `position: relative`, and `overflow: hidden`, so `.ylcf-container { position: absolute; inset: 0; }` can resize with the player without JavaScript width/height synchronization.
- The dedicated container keeps frequent flow message append/remove/reuse churn out of YouTube's video container subtree.

The container uses `contain: layout paint style` to limit layout and paint invalidation to the overlay subtree. This is the useful performance boundary here; Shadow DOM is not a layout isolation primitive.

## Shadow DOM

Do not add Shadow DOM for flow message performance alone.

Shadow DOM may help if YouTube CSS starts leaking into flow message rendering, but it does not avoid layout, paint, image decode, or `getBoundingClientRect()` costs. If it is ever needed for style isolation, use one shadow root on `.ylcf-container`, not one shadow root per message.

## HTML String Rendering

The current message render path serializes YouTube message content to HTML and parses it again:

1. `message-parser.ts` reads `#message.innerHTML`.
2. `message-renderer.ts` assigns `el.innerHTML = html`.
3. Renderer walks `img` nodes to apply emoji style settings.

`Element.setHTMLUnsafe()` is not a useful optimization target. It still parses an HTML string into DOM, and its main value is declarative shadow DOM / sanitizer integration, not render speed. It should not replace `innerHTML` unless there is a separate API compatibility reason.

## DOM Import Optimization

`Document.importNode()` is the only currently identified message-content optimization with meaningful benchmark signal.

Benchmark summary from Chrome 145 on Windows, 6000 iterations x 7 rounds, including emoji image post-processing:

| Path                                   |   Median | Per message | Relative to current |
| -------------------------------------- | -------: | ----------: | ------------------: |
| `source.innerHTML -> target.innerHTML` | 354.3 ms |     59.1 us |               1.00x |
| cached `innerHTML` string              | 296.4 ms |     49.4 us |               1.20x |
| `setHTMLUnsafe(source.innerHTML)`      | 336.8 ms |     56.1 us |               1.05x |
| `setHTMLUnsafe(cachedHtml)`            | 285.3 ms |     47.6 us |               1.24x |
| `cloneNode` children                   | 321.2 ms |     53.5 us |               1.10x |
| `importNode` children                  | 234.8 ms |     39.1 us |               1.51x |
| `cloneNode` via fragment               | 266.0 ms |     44.3 us |               1.33x |

This benchmark only covers message-content construction plus emoji post-processing. Real end-to-end gains will be smaller because `waitLayoutImagesLoaded()`, layout measurement, paint, compositing, and image decode/cache behavior still remain.

Do not implement this until real profiling shows `render()` is a material hot spot. A reasonable trigger is sustained render cost above roughly 25-30% of per-message processing time during high-throughput chat.

If implemented, the renderer must be target-document aware because chat parsing runs in the live chat iframe while flow messages are mounted into `parent.document`:

- Keep `html?: string` as a fallback.
- Add DOM-backed content such as `messageNodes?: Node[]`.
- In the renderer, create all new nodes from the target document.
- Import source nodes with `targetDocument.importNode(node, true)`.
- Continue running the existing emoji `image` / `text` / `none` processing after import.

Avoid a half-step that uses iframe-owned `cloneNode()` results and relies on browser adoption when appending to `parent.document`; that makes benchmark results less predictive and cross-document behavior harder to reason about.
