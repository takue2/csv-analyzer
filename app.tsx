import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as duckdb from '@duckdb/duckdb-wasm';

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
        error: '',
        dataInfo: '',
        query: 'SELECT * FROM csv_data LIMIT 10;',
        results: [],
        isInitialized: false
    });

    const urlInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        initDuckDB();
    }, []);

    const initDuckDB = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: '' }));
            
            const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
            const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
            const worker_url = URL.createObjectURL(
                new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
            );
            
            const worker = new Worker(worker_url);
            const logger = new duckdb.ConsoleLogger();
            const db = new duckdb.AsyncDuckDB(logger, worker);
            await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
            URL.revokeObjectURL(worker_url);
            
            const conn = await db.connect();
            
            setState(prev => ({
                ...prev,
                db,
                conn,
                isLoading: false,
                isInitialized: true
            }));
            
            console.log('DuckDB initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DuckDB:', error);
            setState(prev => ({
                ...prev,
                error: `Failed to initialize DuckDB: ${error}`,
                isLoading: false
            }));
        }
    };

    const parseCSV = (text: string): string[][] => {
        const result: string[][] = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const row: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
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
            setState(prev => ({ ...prev, error: 'DuckDB is not initialized' }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isLoading: true, error: '' }));
            
            await state.conn.query('DROP TABLE IF EXISTS csv_data');
            
            const parsedData = parseCSV(csvText);
            if (parsedData.length === 0) {
                throw new Error('No data found in CSV');
            }
            
            const headers = parsedData[0];
            if (!headers || headers.length === 0) {
                throw new Error('Invalid CSV: no headers found');
            }
            const rows = parsedData.slice(1);
            
            const columnDefs = headers.map(header => `"${header.replace(/"/g, '""')}" VARCHAR`).join(', ');
            await state.conn.query(`CREATE TABLE csv_data (${columnDefs})`);
            
            const batchSize = 1000;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const values = batch.map(row => 
                    `(${row.map(cell => `'${String(cell).replace(/'/g, "''")}'`).join(', ')})`
                ).join(', ');
                
                if (values) {
                    await state.conn.query(`INSERT INTO csv_data VALUES ${values}`);
                }
            }
            
            const result = await state.conn.query('SELECT COUNT(*) as count FROM csv_data');
            const count = result.toArray()[0].count;
            
            setState(prev => ({
                ...prev,
                dataInfo: `Loaded ${count} rows from ${source}`,
                isLoading: false,
                error: ''
            }));
            
        } catch (error) {
            console.error('Error loading CSV data:', error);
            setState(prev => ({
                ...prev,
                error: `Failed to process CSV data: ${error}`,
                isLoading: false
            }));
        }
    };

    const loadCSVFromUrl = async (url: string) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: '' }));
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const text = await response.text();
            await loadCSVData(text, url);
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: `Failed to load CSV from URL: ${error}`,
                isLoading: false
            }));
        }
    };

    const loadCSVFromFile = async (file: File) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: '' }));
            const text = await file.text();
            await loadCSVData(text, file.name);
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: `Failed to load CSV file: ${error}`,
                isLoading: false
            }));
        }
    };

    const handleLoadCSV = async () => {
        setState(prev => ({ ...prev, error: '', dataInfo: '' }));
        
        const fileInput = fileInputRef.current as HTMLInputElement;
        const urlInput = urlInputRef.current as HTMLInputElement;
        
        if (fileInput?.files?.[0]) {
            await loadCSVFromFile(fileInput.files[0]);
        } else if (urlInput?.value.trim()) {
            await loadCSVFromUrl(urlInput.value.trim());
        } else {
            setState(prev => ({ ...prev, error: 'Please provide either a URL or select a file' }));
        }
    };

    const executeQuery = async () => {
        if (!state.conn) {
            setState(prev => ({ ...prev, error: 'DuckDB is not initialized' }));
            return;
        }

        const query = state.query.trim();
        if (!query) {
            setState(prev => ({ ...prev, error: 'Please enter a SQL query' }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isLoading: true, error: '' }));
            
            const result = await state.conn.query(query);
            const data = result.toArray();
            
            setState(prev => ({
                ...prev,
                results: data,
                isLoading: false
            }));
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: `Query error: ${error}`,
                isLoading: false
            }));
        }
    };

    const handleUrlChange = () => {
        const urlInput = urlInputRef.current as HTMLInputElement;
        const fileInput = fileInputRef.current as HTMLInputElement;
        if (urlInput?.value && fileInput) {
            fileInput.value = '';
        }
    };

    const handleFileChange = () => {
        const fileInput = fileInputRef.current as HTMLInputElement;
        const urlInput = urlInputRef.current as HTMLInputElement;
        if (fileInput?.files?.[0] && urlInput) {
            urlInput.value = '';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
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
                        ...(state.isLoading || !state.isInitialized ? styles.btnDisabled : {})
                    }}
                >
                    {state.isInitialized ? 'Load CSV' : 'Initializing...'}
                </button>
                
                {state.dataInfo && (
                    <div style={styles.info}>{state.dataInfo}</div>
                )}
                {state.error && (
                    <div style={styles.error}>{state.error}</div>
                )}
            </div>
            
            {state.dataInfo && (
                <div style={styles.card}>
                    <div style={styles.querySection}>
                        <h2>SQL Query</h2>
                        <textarea
                            value={state.query}
                            onChange={(e) => setState(prev => ({ ...prev, query: (e.target as HTMLTextAreaElement).value }))}
                            onKeyDown={handleKeyDown}
                            placeholder="SELECT * FROM csv_data LIMIT 10;"
                            style={styles.textarea}
                        />
                        <br /><br />
                        <button 
                            onClick={executeQuery}
                            disabled={state.isLoading}
                            style={{
                                ...styles.btn,
                                ...(state.isLoading ? styles.btnDisabled : {})
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
                            {headers.map(header => (
                                <th key={header} style={styles.th}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} style={styles.tr}>
                                {headers.map(header => (
                                    <td key={header} style={styles.td}>
                                        {String(row[header] ?? '')}
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

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
    } as React.CSSProperties,
    
    header: {
        textAlign: 'center' as const,
        color: 'white',
        marginBottom: '2rem',
    } as React.CSSProperties,
    
    card: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        padding: '2rem',
        marginBottom: '2rem',
    } as React.CSSProperties,
    
    inputSection: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    
    inputGroup: {
        flex: 1,
        minWidth: '300px',
    } as React.CSSProperties,
    
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #e1e5e9',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    
    btn: {
        background: '#667eea',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    } as React.CSSProperties,
    
    btnDisabled: {
        background: '#ccc',
        cursor: 'not-allowed',
    } as React.CSSProperties,
    
    querySection: {
        marginTop: '2rem',
    } as React.CSSProperties,
    
    textarea: {
        width: '100%',
        minHeight: '120px',
        padding: '1rem',
        border: '2px solid #e1e5e9',
        borderRadius: '8px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: '0.9rem',
        resize: 'vertical' as const,
        boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    
    resultsSection: {
        marginTop: '2rem',
    } as React.CSSProperties,
    
    tableContainer: {
        overflow: 'auto',
        maxHeight: '500px',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
    } as React.CSSProperties,
    
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '0.9rem',
    } as React.CSSProperties,
    
    th: {
        padding: '0.75rem',
        textAlign: 'left' as const,
        borderBottom: '1px solid #e1e5e9',
        background: '#f8f9fa',
        fontWeight: '600',
        position: 'sticky' as const,
        top: 0,
    } as React.CSSProperties,
    
    td: {
        padding: '0.75rem',
        textAlign: 'left' as const,
        borderBottom: '1px solid #e1e5e9',
    } as React.CSSProperties,
    
    tr: {
        ':hover': {
            background: '#f8f9fa',
        }
    } as React.CSSProperties,
    
    loading: {
        textAlign: 'center' as const,
        padding: '2rem',
        color: '#666',
    } as React.CSSProperties,
    
    error: {
        background: '#fee',
        color: '#c33',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #fcc',
        margin: '1rem 0',
    } as React.CSSProperties,
    
    info: {
        background: '#e3f2fd',
        color: '#1976d2',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #bbdefb',
        margin: '1rem 0',
    } as React.CSSProperties,
    
    resultCount: {
        marginTop: '1rem',
        color: '#666',
    } as React.CSSProperties,
};

// Global styles
const globalStyles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        margin: 0;
        padding: 0;
    }
    
    input[type="url"]:focus, input[type="file"]:focus {
        outline: none;
        border-color: #667eea !important;
    }
    
    textarea:focus {
        outline: none;
        border-color: #667eea !important;
    }
    
    .btn:hover:not(:disabled) {
        background: #5a6fd8 !important;
    }
    
    tr:hover {
        background: #f8f9fa !important;
    }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

const root = createRoot(document.getElementById('root')!);
root.render(<CSVAnalyzer />);