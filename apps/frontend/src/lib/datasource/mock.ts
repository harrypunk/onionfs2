import { of } from "rxjs";
import type { NodeDataSource } from "./types";
import type { NodeInfo } from "$lib/types";

const MOCK_NODES: NodeInfo[] = [
	{
		id: "desktop3",
		clusterUrl: "desktop3.svc.local",
		publicUrl: "agent1.lan:5001",
		status: "online",
		mounts: [
			{ name: "data1", path: "/data1", size: "4.0 TB" },
			{ name: "nvme1", path: "/mnt/nvme1", size: "1.9 TB" },
		],
	},
	{
		id: "rpi4-node1",
		clusterUrl: "rpi4-node1.svc.local",
		publicUrl: "rpi4.lan:5001",
		status: "online",
		mounts: [{ name: "usb1", path: "/mnt/usb1", size: "465 GB" }],
	},
	{
		id: "rpi4-node2",
		clusterUrl: "rpi4-node2.svc.local",
		publicUrl: "rpi4-2.lan:5001",
		status: "offline",
		mounts: [
			{ name: "usb1", path: "/mnt/usb1", size: "465 GB" },
			{ name: "sata1", path: "/mnt/sata1", size: "1.8 TB" },
		],
	},
];

export const mockDataSource: NodeDataSource = {
	fetch() {
		return of(structuredClone(MOCK_NODES));
	},
};
