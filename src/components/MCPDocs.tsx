import React, { useState } from 'react';
import { Copy, Check, Terminal, Server, Plug, Code2, Palette, Map } from 'lucide-react';

interface MCPDocsProps {
  darkMode?: boolean;
}

const CopyButton: React.FC<{ text: string; darkMode?: boolean }> = ({ text, darkMode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors ${
        darkMode
          ? 'hover:bg-gray-600 text-gray-400'
          : 'hover:bg-gray-200 text-gray-500'
      }`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

const CodeBlock: React.FC<{ code: string; language?: string; darkMode?: boolean }> = ({ code, language, darkMode }) => (
  <div className="relative">
    <pre className={`p-4 rounded-lg overflow-x-auto text-sm font-mono ${
      darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-900 text-gray-100'
    }`}>
      <code>{code}</code>
    </pre>
    <CopyButton text={code} darkMode={darkMode} />
  </div>
);

const MCPDocs: React.FC<MCPDocsProps> = ({ darkMode = false }) => {
  const cardClass = `p-5 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`;
  const headingClass = `font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`;
  const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  const badgeClass = `inline-block px-2 py-0.5 rounded text-xs font-mono ${
    darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
  }`;
  const tableHeaderClass = `text-left p-3 font-semibold text-sm ${
    darkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200'
  }`;
  const tableCellClass = `p-3 text-sm ${
    darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'
  }`;

  const remoteConfig = `{
  "mcpServers": {
    "bharatviz": {
      "type": "url",
      "url": "https://bharatviz.saketlab.org/mcp"
    }
  }
}`;

  const localClaudeCodeConfig = `{
  "mcpServers": {
    "bharatviz": {
      "command": "node",
      "args": ["/path/to/bharatviz/server/dist/mcp.js"]
    }
  }
}`;

  const localClaudeDesktopConfig = `{
  "mcpServers": {
    "bharatviz": {
      "command": "node",
      "args": ["/absolute/path/to/bharatviz/server/dist/mcp.js"]
    }
  }
}`;

  const installFromSource = `git clone https://github.com/saketlab/bharatviz.git
cd bharatviz/server
npm install
npm run build`;

  const exampleStatesCall = `// Ask your AI assistant:
"Draw a map of India showing literacy rates by state
 using the viridis color scale"

// The assistant will call render_states_map with:
{
  "data": [
    {"state": "Kerala", "value": 93.91},
    {"state": "Delhi", "value": 86.21},
    {"state": "Maharashtra", "value": 82.34},
    {"state": "Tamil Nadu", "value": 80.09},
    {"state": "Bihar", "value": 63.82}
  ],
  "title": "Literacy Rate by State (%)",
  "colorScale": "viridis",
  "legendTitle": "Literacy Rate (%)"
}`;

  const exampleDistrictsCall = `// Ask your AI assistant:
"Show me a map of Kerala's districts with
 random population data"

// The assistant will call render_districts_map with:
{
  "data": [
    {"state": "Kerala", "district": "Ernakulam", "value": 3282388},
    {"state": "Kerala", "district": "Thiruvananthapuram", "value": 3307284},
    {"state": "Kerala", "district": "Kozhikode", "value": 3089543}
  ],
  "state": "Kerala",
  "title": "Kerala District Population",
  "colorScale": "blues"
}`;

  const mapIds = [
    { id: 'lgd-states', level: 'States', source: 'LGD (Latest Official)', year: '2024' },
    { id: 'lgd-districts', level: 'Districts', source: 'LGD (Latest Official)', year: '2024' },
    { id: 'nfhs5-states', level: 'States', source: 'NFHS-5', year: '2021' },
    { id: 'nfhs5-districts', level: 'Districts', source: 'NFHS-5', year: '2021' },
    { id: 'nfhs4-states', level: 'States', source: 'NFHS-4', year: '2016' },
    { id: 'nfhs4-districts', level: 'Districts', source: 'NFHS-4', year: '2016' },
    { id: 'census-2011-states', level: 'States', source: 'Census 2011', year: '2011' },
    { id: 'census-2011-districts', level: 'Districts', source: 'Census 2011', year: '2011' },
    { id: 'census-2001-states', level: 'States', source: 'Census 2001', year: '2001' },
    { id: 'census-2001-districts', level: 'Districts', source: 'Census 2001', year: '2001' },
    { id: 'census-1991-states', level: 'States', source: 'Census 1991', year: '1991' },
    { id: 'census-1991-districts', level: 'Districts', source: 'Census 1991', year: '1991' },
    { id: 'census-1981-states', level: 'States', source: 'Census 1981', year: '1981' },
    { id: 'census-1981-districts', level: 'Districts', source: 'Census 1981', year: '1981' },
    { id: 'census-1971-states', level: 'States', source: 'Census 1971', year: '1971' },
    { id: 'census-1971-districts', level: 'Districts', source: 'Census 1971', year: '1971' },
    { id: 'census-1961-states', level: 'States', source: 'Census 1961', year: '1961' },
    { id: 'census-1961-districts', level: 'Districts', source: 'Census 1961', year: '1961' },
    { id: 'census-1951-states', level: 'States', source: 'Census 1951', year: '1951' },
    { id: 'census-1951-districts', level: 'Districts', source: 'Census 1951', year: '1951' },
    { id: 'census-1941-states', level: 'States', source: 'Census 1941', year: '1941' },
    { id: 'census-1941-districts', level: 'Districts', source: 'Census 1941', year: '1941' },
    { id: 'soi-states', level: 'States', source: 'Survey of India', year: '2020' },
    { id: 'soi-districts', level: 'Districts', source: 'Survey of India', year: '2020' },
    { id: 'bhuvan-states', level: 'States', source: 'ISRO Bhuvan', year: '2020' },
    { id: 'bhuvan-districts', level: 'Districts', source: 'ISRO Bhuvan', year: '2020' },
    { id: 'nsso-regions', level: 'Regions', source: 'NSSO', year: '2021' },
  ];

  const tools = [
    {
      name: 'list_available_maps',
      description: 'Lists all 27 boundary sets with metadata (id, source, year, level, feature count)',
      input: 'None',
    },
    {
      name: 'list_states',
      description: 'Lists state/UT names for a given boundary type',
      input: 'mapId (string)',
    },
    {
      name: 'list_districts',
      description: 'Lists districts for a boundary type, optionally filtered by state',
      input: 'mapId (string), state? (string)',
    },
    {
      name: 'render_states_map',
      description: 'Renders a state-level choropleth map as 300 DPI PNG',
      input: 'data [{state, value}], mapId?, colorScale?, title?, ...',
    },
    {
      name: 'render_districts_map',
      description: 'Renders a district-level choropleth (all-India or single state)',
      input: 'data [{state, district, value}], mapId?, state?, colorScale?, ...',
    },
    {
      name: 'get_csv_template',
      description: 'Returns a CSV template with all entity names for a boundary type',
      input: 'mapId (string)',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className={`text-2xl ${headingClass} mb-2 flex items-center gap-3`}>
          <Plug className="h-7 w-7" />
          MCP Server for AI Assistants
        </h2>
        <p className={`${textClass} text-lg`}>
          Connect BharatViz to Claude, Codex, or any MCP-compatible AI assistant to generate
          India maps through natural language. The MCP server exposes 6 tools for listing maps,
          querying boundaries, and rendering high-quality choropleth images.
        </p>
      </div>

      {/* Quick Start */}
      <div className="space-y-4">
        <h3 className={`text-xl ${headingClass} flex items-center gap-2`}>
          <Terminal className="h-5 w-5" />
          Quick Start
        </h3>

        <div className={cardClass}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>
            1. Add to your AI assistant (Recommended — no install needed)
          </h4>
          <p className={`${textClass} mb-3`}>
            Use the hosted MCP server at <code className={`font-mono text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>https://bharatviz.saketlab.org/mcp</code>. No cloning or building required.
          </p>

          <div className="space-y-4">
            <div>
              <p className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Claude Code / Claude Desktop / any MCP client (<code className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>.mcp.json</code>):
              </p>
              <CodeBlock code={remoteConfig} darkMode={darkMode} />
            </div>
          </div>
        </div>

        <div className={`${cardClass} opacity-80`}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>
            Alternative: Local install (stdio transport)
          </h4>
          <p className={`${textClass} mb-3`}>
            If you prefer to run the MCP server locally:
          </p>
          <CodeBlock code={installFromSource} darkMode={darkMode} />

          <div className="space-y-4 mt-4">
            <div>
              <p className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Claude Code (<code className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>.mcp.json</code>):
              </p>
              <CodeBlock code={localClaudeCodeConfig} darkMode={darkMode} />
            </div>

            <div>
              <p className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Claude Desktop (<code className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>claude_desktop_config.json</code>):
              </p>
              <CodeBlock code={localClaudeDesktopConfig} darkMode={darkMode} />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>
            2. Start asking for maps
          </h4>
          <p className={`${textClass} mb-2`}>
            Once connected, simply ask your AI assistant to draw maps of India:
          </p>
          <ul className={`list-disc list-inside space-y-1 ${textClass}`}>
            <li>"Draw a map of India showing GDP by state"</li>
            <li>"Show me Kerala's districts colored by population density"</li>
            <li>"Create a dark mode map of literacy rates using the viridis color scale"</li>
            <li>"What maps are available for the 1971 Census boundaries?"</li>
            <li>"Give me a CSV template for LGD district boundaries"</li>
          </ul>
        </div>
      </div>

      {/* Available Tools */}
      <div className="space-y-4">
        <h3 className={`text-xl ${headingClass} flex items-center gap-2`}>
          <Server className="h-5 w-5" />
          Available Tools
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <thead>
              <tr>
                <th className={`${tableHeaderClass} border`}>Tool</th>
                <th className={`${tableHeaderClass} border`}>Description</th>
                <th className={`${tableHeaderClass} border hidden sm:table-cell`}>Input</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.name}>
                  <td className={`${tableCellClass} border font-mono text-xs`}>
                    <span className={badgeClass}>{tool.name}</span>
                  </td>
                  <td className={`${tableCellClass} border`}>{tool.description}</td>
                  <td className={`${tableCellClass} border font-mono text-xs hidden sm:table-cell`}>{tool.input}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Examples */}
      <div className="space-y-4">
        <h3 className={`text-xl ${headingClass} flex items-center gap-2`}>
          <Code2 className="h-5 w-5" />
          Examples
        </h3>

        <div className={cardClass}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>
            State-level map
          </h4>
          <CodeBlock code={exampleStatesCall} darkMode={darkMode} />
        </div>

        <div className={cardClass}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>
            Single-state district map
          </h4>
          <CodeBlock code={exampleDistrictsCall} darkMode={darkMode} />
        </div>
      </div>

      {/* Color Scales */}
      <div className="space-y-4">
        <h3 className={`text-xl ${headingClass} flex items-center gap-2`}>
          <Palette className="h-5 w-5" />
          Color Scales
        </h3>

        <div className={cardClass}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Sequential</h4>
              <div className="space-y-1">
                {['blues', 'greens', 'reds', 'oranges', 'purples', 'pinks'].map(s => (
                  <div key={s} className={`font-mono text-sm ${textClass}`}>{s}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Perceptually Uniform</h4>
              <div className="space-y-1">
                {['viridis', 'plasma', 'inferno', 'magma'].map(s => (
                  <div key={s} className={`font-mono text-sm ${textClass}`}>{s}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Diverging</h4>
              <div className="space-y-1">
                {['spectral', 'rdylbu', 'rdylgn', 'brbg', 'piyg', 'puor', 'aqi'].map(s => (
                  <div key={s} className={`font-mono text-sm ${textClass}`}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Map IDs */}
      <div className="space-y-4">
        <h3 className={`text-xl ${headingClass} flex items-center gap-2`}>
          <Map className="h-5 w-5" />
          All 27 Available Map Boundaries
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <thead>
              <tr>
                <th className={`${tableHeaderClass} border`}>Map ID</th>
                <th className={`${tableHeaderClass} border`}>Level</th>
                <th className={`${tableHeaderClass} border`}>Source</th>
                <th className={`${tableHeaderClass} border`}>Year</th>
              </tr>
            </thead>
            <tbody>
              {mapIds.map((m) => (
                <tr key={m.id}>
                  <td className={`${tableCellClass} border font-mono text-xs`}>{m.id}</td>
                  <td className={`${tableCellClass} border`}>{m.level}</td>
                  <td className={`${tableCellClass} border`}>{m.source}</td>
                  <td className={`${tableCellClass} border`}>{m.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MCPDocs;
