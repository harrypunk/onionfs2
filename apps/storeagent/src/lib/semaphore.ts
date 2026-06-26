/**
 * Simple async counting semaphore.
 *
 * Used to cap the number of concurrent file-read preparations inside
 * `/fs/get`. It does not throttle Bun's internal sendfile streaming, but it
 * prevents a scrubbing storm from overwhelming the event loop with simultaneous
 * stat + slice operations.
 */
export class Semaphore {
	private available: number;
	private readonly queue: Array<() => void> = [];

	constructor(permits: number) {
		if (permits < 1 || !Number.isInteger(permits)) {
			throw new Error(
				"Semaphore must allow a positive integer number of permits",
			);
		}
		this.available = permits;
	}

	/**
	 * Acquire a permit.
	 *
	 * Resolves immediately if one is free, otherwise queues until a permit is
	 * released or the optional abort signal fires.
	 */
	acquire(signal?: AbortSignal): Promise<void> {
		if (signal?.aborted) {
			return Promise.reject(new Error("Request aborted"));
		}
		if (this.available > 0) {
			this.available--;
			return Promise.resolve();
		}
		return new Promise<void>((resolve, reject) => {
			let aborted = false;
			const node = () => {
				if (!aborted) resolve();
			};

			const onAbort = () => {
				aborted = true;
				const idx = this.queue.indexOf(node);
				if (idx !== -1) {
					this.queue.splice(idx, 1);
				}
				reject(new Error("Request aborted"));
			};

			if (signal) {
				signal.addEventListener("abort", onAbort, { once: true });
				if (signal.aborted) {
					onAbort();
					return;
				}
			}

			this.queue.push(node);
		});
	}

	/**
	 * Release a permit.
	 *
	 * If waiters exist, the permit is transferred directly to the next waiter
	 * without incrementing the free count.
	 */
	release(): void {
		const next = this.queue.shift();
		if (next) {
			next();
		} else {
			this.available++;
		}
	}
}
