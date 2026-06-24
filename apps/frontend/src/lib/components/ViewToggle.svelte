<script lang="ts">
	import LayoutGrid from "lucide-svelte/icons/layout-grid";
	import List from "lucide-svelte/icons/list";
	import { ViewMode } from "$lib/types";

	interface Props {
		value: ViewMode;
		onChange?: (mode: ViewMode) => void;
	}

	let { value, onChange }: Props = $props();

	function setMode(mode: ViewMode) {
		onChange?.(mode);
	}
</script>

<div class="buttons has-addons" role="group" aria-label="View mode">
	<button
		class="button"
		class:is-selected={value === ViewMode.List}
		class:is-primary={value === ViewMode.List}
		onclick={() => setMode(ViewMode.List)}
		aria-pressed={value === ViewMode.List}
		title="List view"
		type="button"
	>
		<span class="icon">
			<List size={18} />
		</span>
	</button>
	<button
		class="button"
		class:is-selected={value === ViewMode.Grid}
		class:is-primary={value === ViewMode.Grid}
		onclick={() => setMode(ViewMode.Grid)}
		aria-pressed={value === ViewMode.Grid}
		title="Grid view"
		type="button"
	>
		<span class="icon">
			<LayoutGrid size={18} />
		</span>
	</button>
</div>
