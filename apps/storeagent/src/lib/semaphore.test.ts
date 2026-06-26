import { describe, expect, it } from "bun:test";
import { Semaphore } from "@/lib/semaphore";

describe("Semaphore", () => {
	it("allows immediate acquisition when permits are available", async () => {
		const sem = new Semaphore(2);
		await sem.acquire();
		await sem.acquire();
		sem.release();
		sem.release();
	});

	it("queues acquisitions beyond the permit limit", async () => {
		const sem = new Semaphore(1);
		await sem.acquire();

		let acquired = false;
		const pending = sem.acquire().then(() => {
			acquired = true;
		});

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(acquired).toBe(false);

		sem.release();
		await pending;
		expect(acquired).toBe(true);
	});

	it("transfers released permits to queued waiters", async () => {
		const sem = new Semaphore(1);
		const order: number[] = [];

		await sem.acquire();
		const first = sem.acquire().then(() => order.push(1));
		const second = sem.acquire().then(() => order.push(2));

		sem.release();
		await first;
		sem.release();
		await second;

		expect(order).toEqual([1, 2]);
	});

	it("rejects non-positive or non-integer permit counts", () => {
		expect(() => new Semaphore(0)).toThrow();
		expect(() => new Semaphore(-1)).toThrow();
		expect(() => new Semaphore(1.5)).toThrow();
	});

	it("rejects an already-aborted acquisition", async () => {
		const sem = new Semaphore(1);
		const controller = new AbortController();
		controller.abort();

		await expect(sem.acquire(controller.signal)).rejects.toThrow(
			"Request aborted",
		);
	});

	it("rejects a queued acquisition when the signal aborts", async () => {
		const sem = new Semaphore(1);
		await sem.acquire();

		const controller = new AbortController();
		const pending = sem.acquire(controller.signal);

		controller.abort();

		await expect(pending).rejects.toThrow("Request aborted");
		sem.release();
	});
});
