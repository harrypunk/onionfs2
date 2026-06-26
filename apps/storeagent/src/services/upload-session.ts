/** Metadata for an active multipart upload session. */
export interface UploadSession {
	targetPath: string;
	tempDir: string;
	mount: string;
	relativePath: string;
}

/**
 * Abstract store for upload session metadata.
 *
 * Implementations may be backed by an in-memory Map, a database,
 * NATS JetStream KV, or any external system.
 */
export interface UploadSessionManager {
	/** Persist a session under the given uploadId. */
	save(uploadId: string, session: UploadSession): Promise<void>;

	/** Retrieve a session by uploadId, or undefined if not found. */
	get(uploadId: string): Promise<UploadSession | undefined>;

	/** Remove a session from the store. */
	delete(uploadId: string): Promise<void>;
}

/** In-memory implementation using a JavaScript Map. */
export class InMemoryUploadSessionManager implements UploadSessionManager {
	private sessions = new Map<string, UploadSession>();

	async save(uploadId: string, session: UploadSession): Promise<void> {
		this.sessions.set(uploadId, session);
	}

	async get(uploadId: string): Promise<UploadSession | undefined> {
		return this.sessions.get(uploadId);
	}

	async delete(uploadId: string): Promise<void> {
		this.sessions.delete(uploadId);
	}
}
