<script lang="ts">
	import Artplayer from "artplayer";

	interface Props {
		url: string;
	}

	let { url }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);

	function createPlayer(target: HTMLDivElement, src: string): Artplayer {
		return new Artplayer({
			container: target,
			url: src,
			autoplay: false,
			fullscreen: true,
			pip: true,
			setting: true,
			playbackRate: true,
			aspectRatio: true,
			theme: "#00bcd4",
		});
	}

	$effect(() => {
		if (!container) return;

		const player = createPlayer(container, url);
		return () => player.destroy();
	});
</script>

<div bind:this={container} class="video-preview-container"></div>

<style>
	.video-preview-container {
		width: 100%;
		max-width: 100%;
		max-height: 80vh;
		aspect-ratio: 16 / 9;
	}

	:global(.artplayer) {
		width: 100%;
		height: 100%;
	}
</style>
