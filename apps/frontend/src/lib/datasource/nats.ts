import { type AnnounceMessage, NATS_STREAMS } from "@ononfs2/shared";
import { AckPolicy, connect, DeliverPolicy, JSONCodec } from "nats.ws";
import { EMPTY, from } from "rxjs";
import { catchError, finalize, map, switchMap, tap } from "rxjs/operators";
import type { NodeInfo } from "$lib/types";
import type { NodeDataSource } from "./types";

function toNodeInfo(data: AnnounceMessage): NodeInfo {
	return {
		id: data.node_id,
		publicUrl: data.public_url,
		lastSeen: data.timestamp,
		mounts: data.mounts.map((name) => ({ name })),
	};
}

export class NatsNodeDataSource implements NodeDataSource {
	constructor(private server: string) {}

	fetch() {
		return from(connect({ servers: this.server })).pipe(
			switchMap((nc) => {
				const js = nc.jetstream();
				const jc = JSONCodec<AnnounceMessage>();

				return from(nc.jetstreamManager()).pipe(
					switchMap((jsm) =>
						from(
							jsm.consumers.add(NATS_STREAMS.AGENT_HEARTBEATS, {
								deliver_policy: DeliverPolicy.All,
								ack_policy: AckPolicy.None,
							}),
						),
					),
					switchMap((ci) =>
						from(js.consumers.get(NATS_STREAMS.AGENT_HEARTBEATS, ci.name)),
					),
					switchMap((consumer) => from(consumer.consume())),
					switchMap((msgs) =>
						from(msgs).pipe(
							finalize(() => {
								msgs.stop();
							}),
						),
					),
					map((msg) => jc.decode(msg.data)),
					map(toNodeInfo),
					tap((node) => console.log("[NATS] node:", node.id, node.publicUrl)),
					finalize(() => {
						nc.close().catch(() => {});
					}),
				);
			}),
			catchError((err) => {
				console.error("NATS error:", err);
				return EMPTY;
			}),
		);
	}
}
