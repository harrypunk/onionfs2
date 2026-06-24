import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		},
	},
	{
		files: ["**/*.svelte.ts"],
		languageOptions: {
			parser: ts.parser,
		},
	},
	{
		ignores: [".svelte-kit/**", "build/**", "node_modules/**", "static/**"],
	},
	{
		rules: {
			// False positives when href is built by a helper that calls $app/paths resolve().
			"svelte/no-navigation-without-resolve": "off",
		},
	},
);
