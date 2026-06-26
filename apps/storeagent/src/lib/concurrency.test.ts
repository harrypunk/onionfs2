import { describe, expect, it } from "bun:test";
import { firstValueFrom, Observable, of, throwError } from "rxjs";
import { delay, tap } from "rxjs/operators";
import { withReadConcurrency } from "@/lib/concurrency";
import { Semaphore } from "@/lib/semaphore";

describe("withReadConcurrency", () => {
	it("acquires and releases the semaphore around a successful source", async () => {
		const sem = new Semaphore(1);
		const signal = new AbortController().signal;

		const result = await firstValueFrom(
			of(42).pipe(withReadConcurrency(sem, signal)),
		);
		expect(result).toBe(42);
	});

	it("blocks subsequent subscriptions until the semaphore is released", async () => {
		const sem = new Semaphore(1);
		const signal = new AbortController().signal;
		const order: string[] = [];

		const first$ = of("first").pipe(
			tap(() => order.push("first-acquire")),
			delay(20),
			tap(() => order.push("first-release")),
			withReadConcurrency(sem, signal),
		);

		const second$ = of("second").pipe(
			tap(() => order.push("second-acquire")),
			withReadConcurrency(sem, signal),
		);

		const [first, second] = await Promise.all([
			firstValueFrom(first$),
			firstValueFrom(second$),
		]);

		expect(first).toBe("first");
		expect(second).toBe("second");
		expect(order).toEqual(["first-acquire", "first-release", "second-acquire"]);
	});

	it("errors immediately when the signal is already aborted", async () => {
		const sem = new Semaphore(1);
		const controller = new AbortController();
		controller.abort();

		const err = await firstValueFrom(
			of(42).pipe(withReadConcurrency(sem, controller.signal)),
		).catch((e) => e);

		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Request aborted");
	});

	it("errors when the signal aborts while waiting for a permit", async () => {
		const sem = new Semaphore(1);
		await sem.acquire();

		const controller = new AbortController();
		const pending = firstValueFrom(
			of(42).pipe(withReadConcurrency(sem, controller.signal)),
		);

		controller.abort();

		const err = await pending.catch((e) => e);
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Request aborted");

		sem.release();
	});

	it("errors when the signal aborts after the source is subscribed", async () => {
		const sem = new Semaphore(1);
		const controller = new AbortController();

		const source$ = new Observable<number>((subscriber) => {
			const id = setTimeout(() => subscriber.next(42), 50);
			return () => clearTimeout(id);
		});

		const pending = firstValueFrom(
			source$.pipe(withReadConcurrency(sem, controller.signal)),
		);

		setTimeout(() => controller.abort(), 10);

		const err = await pending.catch((e) => e);
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Request aborted");
	});

	it("releases the semaphore even when the source errors", async () => {
		const sem = new Semaphore(1);
		const signal = new AbortController().signal;

		const err = await firstValueFrom(
			throwError(() => new Error("boom")).pipe(
				withReadConcurrency(sem, signal),
			),
		).catch((e) => e);

		expect(err.message).toBe("boom");
		await expect(sem.acquire()).resolves.toBeUndefined();
	});
});
