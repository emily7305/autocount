# AutoCount

AutoCount is a Vencord/Equicord plugin for counting channels. It reads the latest number in the channel and sends the next one on a timer, so the count keeps going without having to type every number by hand.

> [!CAUTION]
> **WARNING:** Automating a user account (self-botting) is against Discord's Terms of Service and can get your account banned. Use it at your own risk.

## Install

For Vencord, copy the `autoCount` folder into `src/userplugins/` of a Vencord source checkout, then build:

```
pnpm build
```

If Discord doesn't pick it up after that, run `pnpm inject` too. Restart Discord and turn on AutoCount in the plugin settings.

For Equicord it's the same, just put the folder in `src/equicordplugins/` instead.

## Commands

- `/autocount start` starts counting in the channel you run it in. If it was already running somewhere else, it moves here.
- `/autocount stop` stops it.
- `/autocount status` tells you if it's running. When it is, it shows the channel, the last number sent, the sends this session, and when the next send is (or "in progress"). When it isn't running, it shows the last number sent and the send count.

## Settings

- `interval`, default 30. Seconds between sends. Anything under 10 gets bumped up to 10.
- `skipIfLastIsMe`, default on. Doesn't send if the latest number is already yours.
- `stopAtNumber`, default 0. Stops once this number is reached. 0 means off.
- `stopAfterSends`, default 0. Stops after this many sends. 0 means off.

## When it stops by itself

- It hits `stopAtNumber` or `stopAfterSends`.
- Three numbers in a row get rejected, meaning the latest number is lower than the one it sent, three times in a row.
- Discord answers with a 403 or 404 for the channel.

A 429 doesn't stop it. It waits for the retry time Discord gives, or double the interval if there isn't one.

## Testing

- [ ] Run `/autocount start` in a counting channel and check the toast shows up.
- [ ] Check the first send is the latest number plus one.
- [ ] With `skipIfLastIsMe` on, check it doesn't send twice in a row.
- [ ] Turn `skipIfLastIsMe` off and check it sends again on its own.
- [ ] Run `/autocount stop` and check nothing else gets sent.
- [ ] Run `/autocount status` while running and while stopped, and check the output matches the list above.
- [ ] Set `stopAtNumber` to a small number and check it stops there.
- [ ] Set `stopAfterSends` to 2 and check it stops after two sends.
- [ ] Let the count get rejected three times in a row (easiest is deleting its message by hand right after each send) and check it stops with the rejection toast.
- [ ] Turn AutoCount off in the plugin settings and check the timer stops.
