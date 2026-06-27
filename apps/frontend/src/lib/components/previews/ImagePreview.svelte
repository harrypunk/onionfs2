<script lang="ts">
	interface Props {
		url: string;
		fileName: string;
	}

	let { url, fileName }: Props = $props();
</script>

<figure class="image">
	<img src={url} alt={fileName} />
</figure>

<style>
	img {
		max-width: 100%;
		max-height: 80vh;
	}
</style>
