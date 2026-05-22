import { resolve } from "node:path";
import { type Observable, of, throwError } from "rxjs";

/** Result of resolving a logical file request to a physical path. */
export interface ResolvedPath {
	mount: string;
	relativePath: string;
	realPath: string;
}

/**
 * Resolve a logical file path to its absolute physical path within a mount.
 *
 * @param mounts   Configured mount map (logical name → absolute path).
 * @param mount    Logical mount name requested by the client.
 * @param relativePath  Relative path inside the mount.
 * @returns        Observable that emits once with the resolved path.
 */
export function resolveFilePath(
	mounts: Record<string, string>,
	mount: string,
	relativePath: string,
): Observable<ResolvedPath> {
	if (!/^[a-zA-Z0-9]+$/.test(mount)) {
		const err = new Error(`Invalid mount name: ${mount}`);
		(err as NodeJS.ErrnoException).code = "EINVAL";
		return throwError(() => err);
	}

	const basePath = mounts[mount];
	if (!basePath) {
		const err = new Error(`Mount not found: ${mount}`);
		(err as NodeJS.ErrnoException).code = "ENOENT";
		return throwError(() => err);
	}

	const resolvedBase = resolve(basePath);
	const realPath = resolve(resolvedBase, relativePath);

	// Security boundary: prevent directory traversal.
	if (realPath !== resolvedBase && !realPath.startsWith(`${resolvedBase}/`)) {
		const err = new Error("Path traversal detected");
		(err as NodeJS.ErrnoException).code = "EACCES";
		return throwError(() => err);
	}

	return of({ mount, relativePath, realPath });
}
