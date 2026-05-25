import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer } from "loglayer";
import { pino } from "pino";
import { serializeError } from "serialize-error";

const pinoLogger = pino({
	level: process.env.LOG_LEVEL ?? "info",
	transport:
		process.env.NODE_ENV === "production"
			? undefined
			: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				},
});

export const log = new LogLayer({
	errorSerializer: serializeError,
	transport: new PinoTransport({
		logger: pinoLogger,
	}),
});
