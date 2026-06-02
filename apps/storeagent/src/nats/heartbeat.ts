import {
	type AnnounceMessage,
	NATS_STREAMS,
	NATS_SUBJECTS,
} from "@onionfs2/shared";
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

/**
 * Creates an observable that periodically publishes heartbeat announcements
 * to a NATS JetStream stream.
 *
 * On startup, it ensures the `agent_heartbeats` stream exists with a
 * `max_age` of 2× the announce interval. This gives the frontend enough
 * time to discover the latest heartbeat even if it connects shortly after
 * an agent published.
 */
export function createAnnounceHeartbeat(
	config: AppConfig,
	connection: NatsConnection,
): Observable<AnnounceMessage> {
	// Heartbeat period in milliseconds.
	const periodMs = config.announce_interval_sec * 1000;

	// Keep messages alive for twice the announce interval so the frontend
	// can always find at least one heartbeat when it connects.
	const maxAgeNs = config.announce_interval_sec * 2 * 1_000_000_000;

	const js = connection.jetstream();

	// ── Setup: ensure stream exists with correct max_age ──────────────────
	const setup$ = from(connection.jetstreamManager()).pipe(
		switchMap((jsm) =>
			from(jsm.streams.info(NATS_STREAMS.AGENT_HEARTBEATS)).pipe(
				// Stream doesn't exist yet — create it.
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
				// Stream exists — update max_age if it changed (e.g. after config edit).
				switchMap((info) => {
					if (info.config.max_age !== maxAgeNs) {
						return from(
							jsm.streams.update(NATS_STREAMS.AGENT_HEARTBEATS, {
								...info.config,
								max_age: maxAgeNs,
							}),
						).pipe(
							catchError((err) => {
								log.withError(err).warn("Stream update failed");
								return EMPTY;
							}),
						);
					}
					return EMPTY;
				}),
			),
		),
		catchError((err) => {
			log.withError(err).warn("JetStream manager unavailable");
			return EMPTY;
		}),
		ignoreElements(),
	);

	// ── Heartbeat loop: publish every `periodMs` ──────────────────────────
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

	// Run setup first, wait 500ms for stream to settle, then start heartbeats.
	return concat(setup$, timer(500).pipe(ignoreElements()), heartbeat$);
}
