export const CMDS = {
	antAll: 'ant all',
	formatBranch: 'ant format-source-current-branch',
	formatSource: 'formatSource',
	cleanRepo:
		'git clean -fdx -e .classpath -e .idea -e .project -e *.eml -e *.iml -e *.properties',
	prettier: 'npx liferay-npm-scripts prettier',
	profileDxp: 'ant setup-profile-dxp',
	profilePortal: 'ant setup-profile-portal',
	test: 'npx liferay-npm-scripts test',
}
