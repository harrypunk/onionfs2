import { connect, type NatsConnection } from "nats";
import { from, type Observable } from "rxjs";

export function createNatsConnection(
	serverUrl: string,
): Observable<NatsConnection> {
	return from(connect({ servers: serverUrl }));
}
