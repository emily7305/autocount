/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 emily7305
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    interval: {
        type: OptionType.NUMBER,
        description: "Seconds between sends (min 10)",
        default: 30
    },
    skipIfLastIsMe: {
        type: OptionType.BOOLEAN,
        description: "Don't send if the last number is already mine",
        default: true
    }
});

let timer: ReturnType<typeof setTimeout> | null = null;
let channelId: string | null = null;

function getInterval() {
    const secs = Number(settings.store.interval);
    return Math.max(10, Number.isFinite(secs) ? secs : 30) * 1000;
}

function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    channelId = null;
}

export default definePlugin({
    name: "AutoCount",
    description: "Sends the next number in a counting channel on a timer",
    authors: [{ name: "emily7305", id: 0n }],
    settings,

    stop() {
        stop();
    }
});
