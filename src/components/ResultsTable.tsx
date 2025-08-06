import styles from "../styles";

interface ResultsTableProps {
	data: any[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
	if (data.length === 0) {
		return <p>No results found.</p>;
	}

	const headers = Object.keys(data[0]);

	return (
		<div>
			<div style={styles.tableContainer}>
				<table style={styles.table}>
					<thead>
						<tr>
							{headers.map((header) => (
								<th key={header} style={styles.th}>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.map((row, index) => (
							<tr key={index} style={styles.tr}>
								{headers.map((header) => (
									<td key={header} style={styles.td}>
										{String(row[header] ?? "")}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p style={styles.resultCount}>Showing {data.length} rows</p>
		</div>
	);
};

export default ResultsTable;
