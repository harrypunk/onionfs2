import { defer, from, Observable, throwError } from "rxjs";
import { finalize, mergeMap, raceWith } from "rxjs/operators";
import type { Semaphore } from "@/lib/semaphore";

/**
 * Observable operator that acquires a semaphore before subscribing to the
 * source and releases it when the source completes, errors, or is unsubscribed.
 *
 * If the `AbortSignal` fires while waiting for a permit, the wait is aborted
 * and the operator errors with "Request aborted".
 */
export function withReadConcurrency<T>(
	semaphore: Semaphore,
	signal: AbortSignal,
): (source: Observable<T>) => Observable<T> {
	return (source) =>
		defer(() =>
			from(semaphore.acquire(signal)).pipe(
				mergeMap(() => {
					if (signal.aborted) {
						semaphore.release();
						return throwError(() => new Error("Request aborted"));
					}
					return source.pipe(
						raceWith(abortRace(signal)),
						finalize(() => semaphore.release()),
					);
				}),
			),
		);
}

/** Observable that errors the moment the AbortSignal fires. */
function abortRace(signal: AbortSignal): Observable<never> {
	return new Observable((subscriber) => {
		if (signal.aborted) {
			subscriber.error(new Error("Request aborted"));
			return;
		}
		const handler = () => subscriber.error(new Error("Request aborted"));
		signal.addEventListener("abort", handler);
		return () => signal.removeEventListener("abort", handler);
	});
}
