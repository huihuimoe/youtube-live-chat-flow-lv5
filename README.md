# YouTube Live Chat Flow LV5

> A modernized fork of `youtube-live-chat-flow` for flowing YouTube Live chat messages over the video.

`youtube-live-chat-flow-lv5` builds on the original work from [`subdiox/youtube-live-chat-flow`](https://github.com/subdiox/youtube-live-chat-flow). The LV5 fork focuses on current YouTube player compatibility, lower layout pressure during busy live chats, synchronized settings, and a modern MV3 build pipeline.

## Features

- Flow live chat messages over the YouTube video player.
- Keep a YouTube player control button available across current player layout changes.
- Configure per-author visibility, avatar display, message color, and message template.
- Show or hide guest, member, moderator, owner, your own, Super Chat, Super Sticker, and membership messages.
- Tune display time, delay time, max lines, max displays per second, stack direction, and overflow behavior.
- Adjust line height or flexible line count, max width, opacity, background opacity, outline ratio, emoji style, and custom CSS.
- Sync settings through Chrome storage and transfer settings through clipboard import/export.
- Move the chat input into the video controls and keep helper chat menu buttons current.
- Reduce render cost for high-volume chats through layout batching, bounded caches, duplicate listener guards, and cleanup on disconnect.

## Screenshots

![screenshot](.github/img/screenshot1.gif)

## Installation

1. Download `archive.zip` from the [releases page](https://github.com/huihuimoe/youtube-live-chat-flow-lv5/releases) and unzip it.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the unpacked `app` directory.

## Development

```bash
# install dependencies
pnpm install

# run lint, typecheck, unit tests, and production build
pnpm test

# build the unpacked extension into app/
pnpm build

# build and zip dist/archive.zip
pnpm package
```

## License

MIT. This fork keeps the original license notice from `subdiox/youtube-live-chat-flow`.
