import { resolve } from "node:path";
import { type Observable, of, throwError } from "rxjs";
import { FsError, FsErrorCode } from "@/lib/fs-error";

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
		return throwError(
			() =>
				new FsError(
					`Invalid mount name: ${mount}`,
					FsErrorCode.InvalidArgument,
				),
		);
	}

	const basePath = mounts[mount];
	if (!basePath) {
		return throwError(
			() => new FsError(`Mount not found: ${mount}`, FsErrorCode.NotFound),
		);
	}

	const resolvedBase = resolve(basePath);
	const realPath = resolve(resolvedBase, relativePath);

	// Security boundary: prevent directory traversal.
	if (realPath !== resolvedBase && !realPath.startsWith(`${resolvedBase}/`)) {
		return throwError(
			() => new FsError("Path traversal detected", FsErrorCode.AccessDenied),
		);
	}

	return of({ mount, relativePath, realPath });
}
