import { JSONCodec, type NatsConnection } from "nats";
import { type Observable, timer } from "rxjs";
import { map, tap } from "rxjs/operators";
import type { AppConfig } from "@/config";
import { log } from "@/logging";

const jc = JSONCodec();

export interface AnnounceMessage {
	node_id: string;
	mounts: Record<string, string>;
	public_url: string;
}

export function createAnnounceHeartbeat(
	config: AppConfig,
	connection: NatsConnection,
): Observable<AnnounceMessage> {
	const periodMs = config.announce_interval_sec * 1000;

	return timer(0, periodMs).pipe(
		map(() => {
			const msg: AnnounceMessage = {
				node_id: config.node_id,
				mounts: config.mounts,
				public_url: config.public_url,
			};
			return msg;
		}),
		tap((msg) => {
			connection.publish("onionfs.agent.announce", jc.encode(msg));
			log.debug("Announced heartbeat", JSON.stringify(msg));
		}),
	);
}
