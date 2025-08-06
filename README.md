# CSV Analyzer

A client-side CSV analysis tool powered by DuckDB WebAssembly. Analyze CSV data using SQL queries without sending data to any server.

## Features

- **Client-side processing** - All data processing happens in the browser using DuckDB WebAssembly
- **Flexible data loading** - Load CSV files from URLs or local file upload
- **Header configuration** - Choose whether the first row contains headers
- **Custom column definitions** - Define column names and types with SQL syntax
- **SQL querying** - Execute SQL queries on your CSV data
- **CREATE TABLE statement display** - See the generated table schema

## Installation

```bash
bun install
```

## Development

```bash
bun run serve
```

This will build the application and serve it on http://localhost:3000

## Usage

1. **Load CSV Data**:
   - Enter a CSV URL or upload a local file
   - Choose if the first row contains headers
   - Optionally define custom column types (e.g., `name VARCHAR, age INTEGER, salary DECIMAL(10,2)`)

2. **Query Data**:
   - Write SQL queries against the `csv_data` table
   - Use Ctrl+Enter to execute queries
   - View results in the table below

## Column Definition Format

When specifying custom column definitions, use SQL column syntax:
```
column_name DATA_TYPE, column_name2 DATA_TYPE
```

Examples:
- `name VARCHAR, age INTEGER`
- `"product name" VARCHAR, price DECIMAL(10,2), quantity INTEGER`
- `date_created TIMESTAMP, is_active BOOLEAN`

## Technical Details

- Built with React and TypeScript
- Uses DuckDB WebAssembly for SQL processing
- Built and bundled with Bun
- No server required - runs entirely in the browser
