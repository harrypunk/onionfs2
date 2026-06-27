import { getContext, setContext } from "svelte";
import { natsUrl } from "$lib/config";
import { NatsNodeDataSource } from "$lib/datasource/node-source.svelte";
import { NodeInfoMg } from "$lib/managers/NodeInfoMg.svelte";
import { UrlHelper, type ResolveFn } from "$lib/url-helpers";
import { NodelistVM } from "$lib/viewmodels/nodelist-overview.svelte";

const appContextKey = Symbol("appContainer");

/**
 * Application-level service container.
 *
 * Owns the lifecycle of all app-wide singletons (URL helper, datasource,
 * managers, viewmodels) so routes and components receive dependencies through
 * Svelte context instead of importing concrete singletons.
 */
export class AppContainer {
	readonly urlHelper: UrlHelper;
	readonly natsNodeDataSource: NatsNodeDataSource;
	readonly nodeInfoManager: NodeInfoMg;
	readonly overviewVM: NodelistVM;

	constructor(
		resolveFn: ResolveFn,
		ds: NatsNodeDataSource = new NatsNodeDataSource(natsUrl),
	) {
		this.urlHelper = new UrlHelper(
			resolveFn,
			"/file/[node]/[mount]/[[id]]",
			"/preview/[node]/[mount]/[id]",
		);
		this.natsNodeDataSource = ds;
		this.nodeInfoManager = new NodeInfoMg(this.natsNodeDataSource);
		this.overviewVM = new NodelistVM(this.nodeInfoManager);
	}

	start(): void {
		this.natsNodeDataSource.start();
	}
}

/** Provide the app container to descendant components. */
export function setAppContainer(container: AppContainer): void {
	setContext(appContextKey, container);
}

/** Retrieve the app container from a descendant component. */
export function getAppContainer(): AppContainer {
	return getContext<AppContainer>(appContextKey);
}
