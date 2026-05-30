import {
	type AnnounceMessage,
	NATS_STREAMS,
	NATS_SUBJECTS,
} from "@ononfs2/shared";
import {
	JSONCodec,
	type NatsConnection,
	RetentionPolicy,
	StorageType,
} from "nats";
import { concat, EMPTY, from, type Observable, timer } from "rxjs";
import {
	catchError,
	ignoreElements,
	map,
	mergeMap,
	retry,
	switchMap,
	tap,
} from "rxjs/operators";
import type { AppConfig } from "@/config";
import { log } from "@/logging";

const jc = JSONCodec<AnnounceMessage>();

function buildMessage(config: AppConfig): AnnounceMessage {
	return {
		node_id: config.node_id,
		mounts: Object.keys(config.mounts),
		public_url: config.public_url,
		cluster_url: config.cluster_url,
		timestamp: Date.now(),
	};
}

export function createAnnounceHeartbeat(
	config: AppConfig,
	connection: NatsConnection,
): Observable<AnnounceMessage> {
	const periodMs = config.announce_interval_sec * 1000;
	const maxAgeNs = config.announce_interval_sec * 1_000_000_000;
	const js = connection.jetstream();

	const setup$ = from(connection.jetstreamManager()).pipe(
		switchMap((jsm) =>
			from(jsm.streams.info(NATS_STREAMS.AGENT_HEARTBEATS)).pipe(
				catchError(() =>
					from(
						jsm.streams.add({
							name: NATS_STREAMS.AGENT_HEARTBEATS,
							subjects: [NATS_SUBJECTS.AGENT_ANNOUNCE],
							retention: RetentionPolicy.Limits,
							storage: StorageType.File,
							max_age: maxAgeNs,
						}),
					).pipe(
						catchError((err) => {
							log.withError(err).warn("Stream creation race or already exists");
							return EMPTY;
						}),
					),
				),
			),
		),
		catchError((err) => {
			log.withError(err).warn("JetStream manager unavailable");
			return EMPTY;
		}),
		ignoreElements(),
	);

	const heartbeat$ = timer(0, periodMs).pipe(
		map(() => buildMessage(config)),
		mergeMap((msg) =>
			from(js.publish(NATS_SUBJECTS.AGENT_ANNOUNCE, jc.encode(msg))).pipe(
				retry({ count: 3, delay: 1000 }),
				map(() => msg),
				catchError((err) => {
					log.withError(err).error("Heartbeat publish failed");
					return EMPTY;
				}),
			),
		),
		tap((msg) => {
			log.debug("Announced heartbeat", JSON.stringify(msg));
		}),
	);

	return concat(setup$, timer(500).pipe(ignoreElements()), heartbeat$);
}
