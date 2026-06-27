<script lang="ts">
	interface Props {
		url: string;
	}

	let { url }: Props = $props();
</script>

<video controls preload="metadata">
	<source src={url} />
	<p>Your browser does not support HTML5 video.</p>
</video>

<style>
	video {
		max-width: 100%;
		max-height: 80vh;
	}
</style>
