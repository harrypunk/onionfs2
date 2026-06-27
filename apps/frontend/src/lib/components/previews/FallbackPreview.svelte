<script lang="ts">
	interface Props {
		url: string;
	}

	let { url }: Props = $props();
</script>

<div class="box has-text-centered">
	<p class="mb-4">No preview available for this file type.</p>
	<a class="button is-primary" href={url} download>Download file</a>
</div>
