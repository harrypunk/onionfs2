import { concat, NEVER, of } from "rxjs";
import type { NodeInfo } from "$lib/types";
import type { NodeDataSource } from "./types";

const MOCK_NODES: NodeInfo[] = [
	{
		id: "desktop3",
		publicUrl: "agent1.lan:5001",
		lastSeen: Date.now(),
		mounts: [{ name: "data1" }, { name: "nvme1" }],
	},
	{
		id: "rpi4-node1",
		publicUrl: "rpi4.lan:5001",
		lastSeen: Date.now(),
		mounts: [{ name: "usb1" }],
	},
];

export const mockDataSource: NodeDataSource = {
	fetch() {
		return concat(of(MOCK_NODES[0]), of(MOCK_NODES[1]), NEVER);
	},
};
