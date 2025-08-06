import * as duckdb from "@duckdb/duckdb-wasm";
import { useEffect, useRef, useState } from "react";
import styles from "../styles";
import ResultsTable from "./ResultsTable";

interface CSVAnalyzerState {
	db: duckdb.AsyncDuckDB | null;
	conn: duckdb.AsyncDuckDBConnection | null;
	isLoading: boolean;
	error: string;
	dataInfo: string;
	query: string;
	results: any[];
	isInitialized: boolean;
}

const CSVAnalyzer: React.FC = () => {
	const [state, setState] = useState<CSVAnalyzerState>({
		db: null,
		conn: null,
		isLoading: false,
		error: "",
		dataInfo: "",
		query: "SELECT * FROM csv_data LIMIT 10;",
		results: [],
		isInitialized: false,
	});

	const urlInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		initDuckDB();
	}, []);

	const initDuckDB = async () => {
		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));

			const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
			const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
			const worker_url = URL.createObjectURL(
				new Blob([`importScripts("${bundle.mainWorker}");`], {
					type: "text/javascript",
				})
			);

			const worker = new Worker(worker_url);
			const logger = new duckdb.ConsoleLogger();
			const db = new duckdb.AsyncDuckDB(logger, worker);
			await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
			URL.revokeObjectURL(worker_url);

			const conn = await db.connect();

			setState((prev) => ({
				...prev,
				db,
				conn,
				isLoading: false,
				isInitialized: true,
			}));

			console.log("DuckDB initialized successfully");
		} catch (error) {
			console.error("Failed to initialize DuckDB:", error);
			setState((prev) => ({
				...prev,
				error: `Failed to initialize DuckDB: ${error}`,
				isLoading: false,
			}));
		}
	};

	const parseCSV = (text: string): string[][] => {
		const result: string[][] = [];
		const lines = text.split("\n");

		for (const line of lines) {
			if (!line.trim()) continue;

			const row: string[] = [];
			let current = "";
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];

				if (char === '"') {
					inQuotes = !inQuotes;
				} else if (char === "," && !inQuotes) {
					row.push(current.trim());
					current = "";
				} else {
					current += char;
				}
			}

			row.push(current.trim());
			result.push(row);
		}

		return result;
	};

	const loadCSVData = async (csvText: string, source: string) => {
		if (!state.conn) {
			setState((prev) => ({
				...prev,
				error: "DuckDB is not initialized",
			}));
			return;
		}

		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));

			await state.conn.query("DROP TABLE IF EXISTS csv_data");

			const parsedData = parseCSV(csvText);
			if (parsedData.length === 0) {
				throw new Error("No data found in CSV");
			}

			const headers = parsedData[0];
			if (!headers || headers.length === 0) {
				throw new Error("Invalid CSV: no headers found");
			}
			const rows = parsedData.slice(1);

			const columnDefs = headers
				.map((header) => `"${header.replace(/"/g, '""')}" VARCHAR`)
				.join(", ");
			await state.conn.query(`CREATE TABLE csv_data (${columnDefs})`);

			const batchSize = 1000;
			for (let i = 0; i < rows.length; i += batchSize) {
				const batch = rows.slice(i, i + batchSize);
				const values = batch
					.map(
						(row) =>
							`(${row
								.map(
									(cell) =>
										`'${String(cell).replace(/'/g, "''")}'`
								)
								.join(", ")})`
					)
					.join(", ");

				if (values) {
					await state.conn.query(
						`INSERT INTO csv_data VALUES ${values}`
					);
				}
			}

			const result = await state.conn.query(
				"SELECT COUNT(*) as count FROM csv_data"
			);
			const count = result.toArray()[0].count;

			setState((prev) => ({
				...prev,
				dataInfo: `Loaded ${count} rows from ${source}`,
				isLoading: false,
				error: "",
			}));
		} catch (error) {
			console.error("Error loading CSV data:", error);
			setState((prev) => ({
				...prev,
				error: `Failed to process CSV data: ${error}`,
				isLoading: false,
			}));
		}
	};

	const loadCSVFromUrl = async (url: string) => {
		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`
				);
			}
			const text = await response.text();
			await loadCSVData(text, url);
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: `Failed to load CSV from URL: ${error}`,
				isLoading: false,
			}));
		}
	};

	const loadCSVFromFile = async (file: File) => {
		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));
			const text = await file.text();
			await loadCSVData(text, file.name);
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: `Failed to load CSV file: ${error}`,
				isLoading: false,
			}));
		}
	};

	const handleLoadCSV = async () => {
		setState((prev) => ({ ...prev, error: "", dataInfo: "" }));

		const fileInput = fileInputRef.current as HTMLInputElement;
		const urlInput = urlInputRef.current as HTMLInputElement;

		if (fileInput?.files?.[0]) {
			await loadCSVFromFile(fileInput.files[0]);
		} else if (urlInput?.value.trim()) {
			await loadCSVFromUrl(urlInput.value.trim());
		} else {
			setState((prev) => ({
				...prev,
				error: "Please provide either a URL or select a file",
			}));
		}
	};

	const executeQuery = async () => {
		if (!state.conn) {
			setState((prev) => ({
				...prev,
				error: "DuckDB is not initialized",
			}));
			return;
		}

		const query = state.query.trim();
		if (!query) {
			setState((prev) => ({
				...prev,
				error: "Please enter a SQL query",
			}));
			return;
		}

		try {
			setState((prev) => ({ ...prev, isLoading: true, error: "" }));

			const result = await state.conn.query(query);
			const data = result.toArray();

			setState((prev) => ({
				...prev,
				results: data,
				isLoading: false,
			}));
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: `Query error: ${error}`,
				isLoading: false,
			}));
		}
	};

	const handleUrlChange = () => {
		const urlInput = urlInputRef.current as HTMLInputElement;
		const fileInput = fileInputRef.current as HTMLInputElement;
		if (urlInput?.value && fileInput) {
			fileInput.value = "";
		}
	};

	const handleFileChange = () => {
		const fileInput = fileInputRef.current as HTMLInputElement;
		const urlInput = urlInputRef.current as HTMLInputElement;
		if (fileInput?.files?.[0] && urlInput) {
			urlInput.value = "";
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.ctrlKey && e.key === "Enter") {
			e.preventDefault();
			executeQuery();
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h1>CSV Analyzer</h1>
				<p>Analyze CSV data using DuckDB - completely client-side</p>
			</div>

			<div style={styles.card}>
				<h2>Data Source</h2>
				<div style={styles.inputSection}>
					<div style={styles.inputGroup}>
						<label htmlFor="csvUrl">CSV URL:</label>
						<input
							ref={urlInputRef}
							type="url"
							id="csvUrl"
							placeholder="https://example.com/data.csv"
							onChange={handleUrlChange}
							style={styles.input}
						/>
					</div>
					<div style={styles.inputGroup}>
						<label htmlFor="csvFile">Or upload CSV file:</label>
						<input
							ref={fileInputRef}
							type="file"
							id="csvFile"
							accept=".csv,.txt"
							onChange={handleFileChange}
							style={styles.input}
						/>
					</div>
				</div>
				<button
					onClick={handleLoadCSV}
					disabled={state.isLoading || !state.isInitialized}
					style={{
						...styles.btn,
						...(state.isLoading || !state.isInitialized
							? styles.btnDisabled
							: {}),
					}}
				>
					{state.isInitialized ? "Load CSV" : "Initializing..."}
				</button>

				{state.dataInfo && (
					<div style={styles.info}>{state.dataInfo}</div>
				)}
				{state.error && <div style={styles.error}>{state.error}</div>}
			</div>

			{state.dataInfo && (
				<div style={styles.card}>
					<div style={styles.querySection}>
						<h2>SQL Query</h2>
						<textarea
							value={state.query}
							onChange={(e) =>
								setState((prev) => ({
									...prev,
									query: (e.target as HTMLTextAreaElement)
										.value,
								}))
							}
							onKeyDown={handleKeyDown}
							placeholder="SELECT * FROM csv_data LIMIT 10;"
							style={styles.textarea}
						/>
						<br />
						<br />
						<button
							onClick={executeQuery}
							disabled={state.isLoading}
							style={{
								...styles.btn,
								...(state.isLoading ? styles.btnDisabled : {}),
							}}
						>
							Execute Query
						</button>
					</div>
				</div>
			)}

			{state.results.length > 0 && (
				<div style={styles.card}>
					<div style={styles.resultsSection}>
						<h2>Results</h2>
						{state.isLoading ? (
							<div style={styles.loading}>Processing...</div>
						) : (
							<ResultsTable data={state.results} />
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CSVAnalyzer;
