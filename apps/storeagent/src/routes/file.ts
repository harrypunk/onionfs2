import { Hono } from "hono";
import { resolveFileId } from "@/middleware/resolve-file-id";
import { handleFileGet } from "@/routes/file-get-handler";
import type { FilePathVariables } from "@/types";

/**
 * Hono router for id-based file access under `/file/:mount/:id`.
 *
 * The mount is part of the URL; the id is a reversible base64url encoding of
 * the relative path inside that mount, so URLs stay URL-safe while remaining
 * decodable without a server-side lookup table.
 */
const fileRoutes = new Hono<{ Variables: FilePathVariables }>();

fileRoutes.get("/:mount/:id", resolveFileId, (c) => {
	return handleFileGet(c, c.var.realPath, c.var.config);
});

export default fileRoutes;
