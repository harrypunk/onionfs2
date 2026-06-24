export type FileCategory = "image" | "video" | "other";

const IMAGE_EXTENSIONS = new Set([
	"apng",
	"avif",
	"bmp",
	"gif",
	"ico",
	"jpg",
	"jpeg",
	"png",
	"svg",
	"webp",
]);

const VIDEO_EXTENSIONS = new Set([
	"avi",
	"mkv",
	"mov",
	"mp4",
	"mpeg",
	"mpg",
	"ogv",
	"webm",
	"wmv",
]);

function extension(name: string): string {
	const lastDot = name.lastIndexOf(".");
	return lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : "";
}

export function fileCategory(name: string): FileCategory {
	const ext = extension(name);
	if (IMAGE_EXTENSIONS.has(ext)) return "image";
	if (VIDEO_EXTENSIONS.has(ext)) return "video";
	return "other";
}
