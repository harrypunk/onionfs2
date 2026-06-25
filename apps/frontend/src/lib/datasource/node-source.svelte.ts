import { type AnnounceMessage, NATS_STREAMS } from "@onionfs2/shared";
import { AckPolicy, connect, DeliverPolicy, JSONCodec } from "nats.ws";
import type { ConsumerMessages } from "nats.ws";
import { natsUrl } from "$lib/config";
import type { NodeInfo } from "$lib/types";
import { SvelteMap } from "svelte/reactivity";

export type NodeInfoMap = SvelteMap<string, NodeInfo>;

/** Convert a raw NATS announce message into the local NodeInfo shape. */
function toNodeInfo(data: AnnounceMessage): NodeInfo {
	return {
		id: data.node_id,
		publicUrl: data.public_url,
		lastSeen: data.timestamp,
		mounts: data.mounts.map((name) => ({ name })),
	};
}

/**
 * Wraps a NATS message consumer in an async generator.
 *
 * NATS heartbeats are a *continuous* stream, so a single Promise is not enough.
 * An async generator yields one value per heartbeat and lets the caller iterate
 * with `for await...of`. The `finally` block guarantees `msgs.stop()` is called
 * when iteration ends, the loop breaks, or an error is thrown.
 */
async function* decodeHeartbeats(
	msgs: ConsumerMessages,
	jc: ReturnType<typeof JSONCodec<AnnounceMessage>>,
): AsyncGenerator<AnnounceMessage> {
	try {
		for await (const msg of msgs) {
			yield jc.decode(msg.data);
		}
	} finally {
		msgs.stop();
	}
}

/**
 * Subscribes to NATS agent heartbeats and updates the shared NodeInfoManager.
 *
 * This class owns the subscription lifecycle: call `start()` once when the app
 * boots and it keeps listening until the connection drops. No other code should
 * stop, restart, or otherwise manage the NATS consumer.
 */
export class NatsNodeDataSource {
	infoMap: NodeInfoMap = $state(new SvelteMap());
	constructor(private server: string) {}

	/** Start listening to heartbeats. Safe to call multiple times; ignored if already running. */
	start() {
		this.#run();
	}

	async #run(): Promise<void> {
		const nc = await connect({ servers: this.server });
		try {
			const js = nc.jetstream();
			const jc = JSONCodec<AnnounceMessage>();
			const jsm = await nc.jetstreamManager();

			const ci = await jsm.consumers.add(NATS_STREAMS.AGENT_HEARTBEATS, {
				deliver_policy: DeliverPolicy.All,
				ack_policy: AckPolicy.None,
			});

			const consumer = await js.consumers.get(
				NATS_STREAMS.AGENT_HEARTBEATS,
				ci.name,
			);

			for await (const data of decodeHeartbeats(await consumer.consume(), jc)) {
				const tempData = toNodeInfo(data);
				this.infoMap.set(tempData.id, tempData);

				console.log("NATS agent heartbeat: ", tempData.id);
			}
		} catch (err) {
			console.error("NATS error:", err);
		} finally {
			nc.close().catch(() => {});
		}
	}
}

/** Singleton NATS datasource. Started once from the root layout. */
export const natsNodeDataSource = new NatsNodeDataSource(natsUrl);
