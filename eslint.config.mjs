import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
})

export default [
	...baseConfig,
	{
		// Test files import devDependencies (vitest) that are intentionally not part of
		// the published module, so relax the "no unpublished import" rule for them.
		files: ['tests/**/*.ts'],
		rules: {
			'n/no-unpublished-import': 'off',
		},
	},
]
