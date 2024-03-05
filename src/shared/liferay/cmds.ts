export const CMDS = {
	antAll: 'ant all -Dnodejs.node.env=development',
	formatBranch: 'ant format-source-current-branch',
	cleanRepo:
		'git clean -fdx -e .classpath -e .idea -e .project -e *.eml -e *.iml -e *.properties',
	profileDxp: 'ant setup-profile-dxp',
	profilePortal: 'ant setup-profile-portal',
}
