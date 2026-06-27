<script module>
	import { defineMeta } from "@storybook/addon-svelte-csf";
	import PathBreadcrumb from "./PathBreadcrumb.svelte";

	const { Story } = defineMeta({
		title: "Components/PathBreadcrumb",
		component: PathBreadcrumb,
	});

	const homeItem = { label: "Home", href: "/", active: false };
	const middleItem = { label: "Documents", href: "/documents" };
	const activeItem = { label: "Report.pdf", active: true };
</script>

<Story name="Home only" args={{ items: [homeItem] }} />

<Story
	name="Nested path"
	args={{ items: [homeItem, middleItem, activeItem] }}
/>

<Story
	name="No links"
	args={{ items: [{ label: "Step 1" }, { label: "Step 2", active: true }] }}
/>
