import { env } from "$env/dynamic/public";

export const natsUrl = env.PUBLIC_ONIONFS_NATS_URL || "ws://nats.lan:80";
