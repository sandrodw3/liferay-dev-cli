export const CMDS = {
	antAll: 'ant all',
	formatBranch: 'ant format-source-current-branch',
	formatSource: 'formatSource',
	cleanRepo:
		'git clean -fdx -e .classpath -e .idea -e .project -e *.eml -e *.iml -e *.properties',
	profileDxp: 'ant setup-profile-dxp',
	profilePortal: 'ant setup-profile-portal',
	stop: `kill -KILL $(ps aux | grep catalina | head -1 | tr -s ' ' | cut -d ' ' -f2)`,
	test: 'npx node-scripts test',
}
