const styles = {
	container: {
		maxWidth: "1200px",
		margin: "0 auto",
		padding: "2rem",
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		minHeight: "100vh",
	} as React.CSSProperties,

	header: {
		textAlign: "center" as const,
		color: "white",
		marginBottom: "2rem",
	} as React.CSSProperties,

	card: {
		background: "white",
		borderRadius: "12px",
		boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
		padding: "2rem",
		marginBottom: "2rem",
	} as React.CSSProperties,

	inputSection: {
		display: "flex",
		gap: "1rem",
		marginBottom: "2rem",
		flexWrap: "wrap" as const,
	} as React.CSSProperties,

	inputGroup: {
		flex: 1,
		minWidth: "300px",
	} as React.CSSProperties,

	input: {
		width: "100%",
		padding: "0.75rem",
		border: "2px solid #e1e5e9",
		borderRadius: "8px",
		fontSize: "1rem",
		transition: "border-color 0.2s",
		boxSizing: "border-box" as const,
	} as React.CSSProperties,

	btn: {
		background: "#667eea",
		color: "white",
		border: "none",
		padding: "0.75rem 1.5rem",
		borderRadius: "8px",
		cursor: "pointer",
		fontSize: "1rem",
		fontWeight: "600",
		transition: "background-color 0.2s",
	} as React.CSSProperties,

	btnDisabled: {
		background: "#ccc",
		cursor: "not-allowed",
	} as React.CSSProperties,

	querySection: {
		marginTop: "2rem",
	} as React.CSSProperties,

	textarea: {
		width: "100%",
		minHeight: "120px",
		padding: "1rem",
		border: "2px solid #e1e5e9",
		borderRadius: "8px",
		fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
		fontSize: "0.9rem",
		resize: "vertical" as const,
		boxSizing: "border-box" as const,
	} as React.CSSProperties,

	resultsSection: {
		marginTop: "2rem",
	} as React.CSSProperties,

	tableContainer: {
		overflow: "auto",
		maxHeight: "500px",
		border: "1px solid #e1e5e9",
		borderRadius: "8px",
	} as React.CSSProperties,

	table: {
		width: "100%",
		borderCollapse: "collapse" as const,
		fontSize: "0.9rem",
	} as React.CSSProperties,

	th: {
		padding: "0.75rem",
		textAlign: "left" as const,
		borderBottom: "1px solid #e1e5e9",
		background: "#f8f9fa",
		fontWeight: "600",
		position: "sticky" as const,
		top: 0,
	} as React.CSSProperties,

	td: {
		padding: "0.75rem",
		textAlign: "left" as const,
		borderBottom: "1px solid #e1e5e9",
	} as React.CSSProperties,

	tr: {
		":hover": {
			background: "#f8f9fa",
		},
	} as React.CSSProperties,

	loading: {
		textAlign: "center" as const,
		padding: "2rem",
		color: "#666",
	} as React.CSSProperties,

	error: {
		background: "#fee",
		color: "#c33",
		padding: "1rem",
		borderRadius: "8px",
		border: "1px solid #fcc",
		margin: "1rem 0",
	} as React.CSSProperties,

	info: {
		background: "#e3f2fd",
		color: "#1976d2",
		padding: "1rem",
		borderRadius: "8px",
		border: "1px solid #bbdefb",
		margin: "1rem 0",
	} as React.CSSProperties,

	resultCount: {
		marginTop: "1rem",
		color: "#666",
	} as React.CSSProperties,
};

export default styles;
