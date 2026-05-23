/** Typed error codes for filesystem operations. */
export enum FsErrorCode {
	InvalidArgument = "EINVAL",
	NotFound = "ENOENT",
	AccessDenied = "EACCES",
	PermissionDenied = "EPERM",
	NotAFile = "EISDIR",
	Unknown = "UNKNOWN",
}

/** Custom error type that carries a typed {@link FsErrorCode}. */
export class FsError extends Error {
	constructor(
		message: string,
		public readonly code: FsErrorCode,
	) {
		super(message);
		this.name = "FsError";
	}
}

/** Map a native Node.js `fs` error to our typed {@link FsError}. */
export function fromNodeError(err: NodeJS.ErrnoException): FsError {
	switch (err.code) {
		case "ENOENT":
			return new FsError(err.message, FsErrorCode.NotFound);
		case "EACCES":
			return new FsError(err.message, FsErrorCode.AccessDenied);
		case "EPERM":
			return new FsError(err.message, FsErrorCode.PermissionDenied);
		default:
			return new FsError(
				err.message || "File system error",
				FsErrorCode.Unknown,
			);
	}
}
