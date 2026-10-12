/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 emily7305
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import { sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { Constants, RestAPI, showToast, UserStore } from "@webpack/common";

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
let busy = false;
let nextAt = 0;
let lastSent: bigint | null = null;
let sends = 0;

function getInterval() {
    const secs = Number(settings.store.interval);
    return Math.max(10, Number.isFinite(secs) ? secs : 30) * 1000;
}

function schedule(ms: number) {
    if (timer) clearTimeout(timer);
    nextAt = Date.now() + ms;
    timer = setTimeout(tick, ms);
}

function start(id: string) {
    channelId = id;
    lastSent = null;
    sends = 0;
    showToast("AutoCount started", "success");
    schedule(0);
}

function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    const wasRunning = channelId !== null;
    channelId = null;
    if (wasRunning) showToast("AutoCount stopped");
}

async function tick() {
    timer = null;
    // previous request still going, it will schedule the next one itself
    if (busy || !channelId) return;

    busy = true;
    const target = channelId;
    try {
        await countOnce(target);
    } catch (e) {
        console.error("[AutoCount]", e);
    } finally {
        busy = false;
        if (channelId === target) schedule(getInterval());
    }
}

async function countOnce(target: string) {
    const res = await RestAPI.get({
        url: Constants.Endpoints.MESSAGES(target),
        query: { limit: 10 }
    });
    if (channelId !== target) return;

    // discord returns newest first
    const msgs: any[] = Array.isArray(res?.body) ? res.body : [];
    const latest = msgs.find(m => typeof m?.content === "string" && /^\d+$/.test(m.content.trim()));
    if (!latest) return;

    const current = BigInt(latest.content.trim());

    if (settings.store.skipIfLastIsMe && latest.author?.id === UserStore.getCurrentUser()?.id) return;

    const next = current + 1n;

    await sendMessage(target, { content: next.toString() });

    lastSent = next;
    sends++;

}

export default definePlugin({
    name: "AutoCount",
    description: "Sends the next number in a counting channel on a timer",
    authors: [{ name: "emily7305", id: 0n }],
    settings,

    commands: [{
        name: "autocount",
        description: "Control auto counting in this channel",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [{
            name: "action",
            description: "start, stop or status",
            type: ApplicationCommandOptionType.STRING,
            required: true,
            choices: [
                { name: "start", label: "start", value: "start" },
                { name: "stop", label: "stop", value: "stop" },
                { name: "status", label: "status", value: "status" }
            ]
        }],
        execute(args, ctx) {
            const action = findOption<string>(args, "action", "");
            const here = ctx.channel.id;

            if (action === "start") {
                if (channelId) stop();
                start(here);
                sendBotMessage(here, { content: `Counting here every ${getInterval() / 1000}s.` });
            } else if (action === "stop") {
                if (!channelId) {
                    sendBotMessage(here, { content: "Not running." });
                    return;
                }
                stop();
                sendBotMessage(here, { content: "Stopped." });
            } else if (action === "status") {
                if (!channelId) {
                    sendBotMessage(here, { content: `Not running. Last number sent: ${lastSent ?? "none"}, sends: ${sends}` });
                    return;
                }
                const secs = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
                sendBotMessage(here, {
                    content: [
                        "Running",
                        `Channel: <#${channelId}>`,
                        `Last number sent: ${lastSent ?? "none"}`,
                        `Sends this session: ${sends}`,
                        busy ? "Next send: in progress" : `Next send in: ${secs}s`
                    ].join("\n")
                });
            }
        }
    }],

    stop() {
        stop();
    }
});
