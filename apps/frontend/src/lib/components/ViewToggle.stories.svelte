<script module>
	import { defineMeta } from "@storybook/addon-svelte-csf";
	import { ViewMode } from "$lib/types";
	import ViewToggle from "./ViewToggle.svelte";

	const { Story } = defineMeta({
		title: "Components/ViewToggle",
		component: ViewToggle,
	});
</script>

<Story name="List" args={{ value: ViewMode.List }} />

<Story name="Grid" args={{ value: ViewMode.Grid }} />

<Story name="Interactive">
	<ViewToggle
		value={ViewMode.List}
		onChange={(mode) => console.log("view mode changed:", mode)}
	/>
</Story>
