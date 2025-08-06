import { createRoot } from "react-dom/client";
import CSVAnalyzer from "./components/CSVAnalyzer";

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
const styleSheet = document.createElement("style");
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

const root = createRoot(document.getElementById("root")!);
root.render(<CSVAnalyzer />);
