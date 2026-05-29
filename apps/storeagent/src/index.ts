import { EMPTY } from "rxjs";
import { catchError, switchMap, tap } from "rxjs/operators";
import { createApp } from "@/app";
import { loadConfig } from "@/config";
import { log } from "@/logging";
import { createNatsConnection } from "@/nats/client";
import { createAnnounceHeartbeat } from "@/nats/heartbeat";

const cfg = await loadConfig();
log.debug("Config loaded:", JSON.stringify(cfg, null, 2));

const app = createApp(cfg);

createNatsConnection(cfg.nats_server)
	.pipe(
		tap((_nc) => {
			log.info(`Connected to NATS at ${cfg.nats_server}`);
			log.info(
				`StoreAgent "${cfg.node_id}" announcing every ${cfg.announce_interval_sec}s`,
			);
		}),
		switchMap((nc) =>
			createAnnounceHeartbeat(cfg, nc).pipe(
				catchError((err) => {
					log.withError(err).error("Heartbeat error");
					return EMPTY;
				}),
			),
		),
		catchError((err) => {
			log.withError(err).error("NATS heartbeat failed to start");
			return EMPTY;
		}),
	)
	.subscribe();

export default {
	hostname: cfg.bind_addr,
	port: cfg.bind_port,
	fetch: app.fetch,
};
