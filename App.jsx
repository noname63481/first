import React, { useState, useEffect } from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { Button, Switch, Paper, Typography, IconButton } from "@mui/material";
import { Moon, Sun, Plus, Delete } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";

// Default Code for MUI Test
const defaultCode = `
function Fun() {
  return(
    <h1>Hello</h1>
  )
}
 `;

// Function to extract imports from code
const extractImports = (code) => {
  const importRegex =
    /import\s+(?:{[^}]*}|\*\s+as\s+[^;]*|[^;]*)\s+from\s+['"](.*?)['"];/g;
  const matches = [...code.matchAll(importRegex)];

  return matches.map((match) => {
    const importPath = match[1];
    return {
      fullMatch: match[0],
      path: importPath,
    };
  });
};

// Function to remove import statements from code
const removeImports = (code) => {
  return code.replace(
    /import\s+(?:{[^}]*}|\*\s+as\s+[^;]*|[^;]*)\s+from\s+['"](.*?)['"];/g,
    ""
  );
};

// Function to find the main component name
const findMainComponent = (code) => {
  // Look for function components
  console.log("Finding main component", code);
  const functionComponentRegex = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  let match;
  let lastComponent = null;

  while ((match = functionComponentRegex.exec(code)) !== null) {
    lastComponent = match[1];
  }

  // Look for arrow function components (const App = () => {})
  if (!lastComponent) {
    const arrowComponentRegex =
      /const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\([^)]*\)\s*=>/g;
    while ((match = arrowComponentRegex.exec(code)) !== null) {
      lastComponent = match[1];
    }
  }
  console.log("Main component:", lastComponent);

  return lastComponent;
};

const ensureRenderCall = (code) => {
  console.log("Ensuring code has a render call", code);

  // Avoid duplicate `createRoot()` calls
  if (code.includes("createRoot(")) {
    return code;
  }

  const componentName = findMainComponent(code);

  // Generate the corrected version with correct order
  if (componentName) {
    return `
        ${code}

        import { createRoot } from "react-dom/client";        
        const root = document.createElement("div");
        document.body.appendChild(root);
        createRoot(root).render(<${componentName} />);
    `;
  } else {
    return `
        ${code}
        import { createRoot } from "react-dom/client";
        const root = document.createElement("div");
        document.body.appendChild(root);
        createRoot(root).render(<div>Code Preview</div>);
    `;
  }
};

// Enhanced function to load modules dynamically
const loadModuleDynamically = async (modulePath) => {
  console.log(`Loading module: ${modulePath}`);

  // Create mock objects for MUI components
  const createMockMUIComponent = (name) => {
    return (props) => {
      return React.createElement(
        "div",
        {
          ...props,
          className: `mui-${name.toLowerCase()}`,
          style: {
            ...props.style,
            border: "1px dashed #ccc",
            padding: "8px",
            margin: "4px",
            display: "block",
          },
        },
        props.children || `Mock ${name}`
      );
    };
  };

  // Mock module system
  const moduleMap = {
    react: React,
    "react-dom": {
      render: (element) => console.log("React DOM render called"),
    },
    "@mui/material": {
      // Basic components
      Button: createMockMUIComponent("Button"),
      TextField: createMockMUIComponent("TextField"),
      Switch: createMockMUIComponent("Switch"),
      Checkbox: createMockMUIComponent("Checkbox"),
      Radio: createMockMUIComponent("Radio"),

      // Layout components
      Box: createMockMUIComponent("Box"),
      Card: createMockMUIComponent("Card"),
      CardContent: createMockMUIComponent("CardContent"),
      CardActions: createMockMUIComponent("CardActions"),
      Container: createMockMUIComponent("Container"),
      Grid: createMockMUIComponent("Grid"),
      Paper: createMockMUIComponent("Paper"),

      // Typography
      Typography: createMockMUIComponent("Typography"),

      // Form components
      FormControl: createMockMUIComponent("FormControl"),
      FormControlLabel: createMockMUIComponent("FormControlLabel"),
      FormGroup: createMockMUIComponent("FormGroup"),
      FormLabel: createMockMUIComponent("FormLabel"),
      InputLabel: createMockMUIComponent("InputLabel"),

      // Additional components
      Alert: createMockMUIComponent("Alert"),
      AppBar: createMockMUIComponent("AppBar"),
      Avatar: createMockMUIComponent("Avatar"),
      Badge: createMockMUIComponent("Badge"),
      Chip: createMockMUIComponent("Chip"),
      Divider: createMockMUIComponent("Divider"),
      Drawer: createMockMUIComponent("Drawer"),
      Icon: createMockMUIComponent("Icon"),
      List: createMockMUIComponent("List"),
      ListItem: createMockMUIComponent("ListItem"),
      Menu: createMockMUIComponent("Menu"),
      MenuItem: createMockMUIComponent("MenuItem"),
      Modal: createMockMUIComponent("Modal"),
      Popover: createMockMUIComponent("Popover"),
      Slider: createMockMUIComponent("Slider"),
      Snackbar: createMockMUIComponent("Snackbar"),
      Table: createMockMUIComponent("Table"),
      TableBody: createMockMUIComponent("TableBody"),
      TableCell: createMockMUIComponent("TableCell"),
      TableHead: createMockMUIComponent("TableHead"),
      TableRow: createMockMUIComponent("TableRow"),
      Tabs: createMockMUIComponent("Tabs"),
      Tab: createMockMUIComponent("Tab"),
      Toolbar: createMockMUIComponent("Toolbar"),
      Tooltip: createMockMUIComponent("Tooltip"),

      // Use actual MUI components if available
      ...(Paper ? { Paper } : {}),
      ...(Button ? { Button } : {}),
      ...(Typography ? { Typography } : {}),
      ...(Switch ? { Switch } : {}),
    },
    "@mui/icons-material": {
      // Mock icons
      Add: () => React.createElement("span", {}, "+"),
      Delete: () => React.createElement("span", {}, "x"),
      Edit: () => React.createElement("span", {}, "✎"),
      // Add more icons as needed
    },
    lodash: {
      map: (arr, fn) => arr.map(fn),
      filter: (arr, fn) => arr.filter(fn),
      reduce: (arr, fn, initial) => arr.reduce(fn, initial),
    },
    axios: {
      get: () => Promise.resolve({ data: {} }),
      post: () => Promise.resolve({ data: {} }),
    },
  };

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (moduleMap[modulePath]) {
    return moduleMap[modulePath];
  } else {
    console.warn(`Module ${modulePath} not found in available modules`);
    return null;
  }
};

// Live Code Editor Component
export default function LiveCodeEditor() {
  const [code, setCode] = useState(defaultCode);
  const [darkMode, setDarkMode] = useState(true);
  const [files, setFiles] = useState([
    { name: "MUITest.js", content: defaultCode },
  ]);
  const [loadedModules, setLoadedModules] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [processedCode, setProcessedCode] = useState(defaultCode);
  const [error, setError] = useState(null);

  const toggleTheme = () => setDarkMode(!darkMode);

  const addNewFile = () => {
    const newFile = { name: `NewFile${files.length}.js`, content: "" };
    setFiles([...files, newFile]);
  };

  const deleteFile = (index) => {
    if (files.length > 1) {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      setCode(updatedFiles[0].content);
    }
  };

  // Process code for react-live
  useEffect(() => {
    const processCode = async () => {
      try {
        setError(null);
        const imports = extractImports(code);

        if (imports.length > 0) {
          setIsLoading(true);

          // Load all required modules
          const newModules = { ...loadedModules };
          for (const importInfo of imports) {
            if (!loadedModules[importInfo.path]) {
              try {
                const module = await loadModuleDynamically(importInfo.path);
                if (module) {
                  newModules[importInfo.path] = module;
                }
              } catch (err) {
                console.error(`Failed to load module ${importInfo.path}:`, err);
                setError(
                  `Failed to load module ${importInfo.path}: ${err.message}`
                );
              }
            }
          }

          setLoadedModules(newModules);
          setIsLoading(false);
        }

        // Process code for react-live by removing imports and ensuring render call
        const codeWithoutImports = removeImports(code);
        const preparedCode = ensureRenderCall(codeWithoutImports);
        console.log("Processed code:", preparedCode);
        setProcessedCode(preparedCode);
      } catch (err) {
        console.error("Error processing code:", err);
        setError(`Error processing code: ${err.message}`);
        setIsLoading(false);
      }
    };

    processCode();
  }, [code]);

  // Create a complete scope with all required items for react-live
  const createScope = () => {
    // Base scope with essential React elements
    const scope = {
      React,
      // Function components need Component
      Component: React.Component,
      // Add useState and other hooks
      useState: React.useState,
      useEffect: React.useEffect,
      useRef: React.useRef,
      useContext: React.useContext,
      useMemo: React.useMemo,
      useCallback: React.useCallback,
      useReducer: React.useReducer,

      // Add modules from loadedModules (spread individual modules)
      ...Object.values(loadedModules).reduce(
        (acc, module) => ({ ...acc, ...module }),
        {}
      ),
    };

    return scope;
  };

  return (
    <div
      className={`min-h-screen p-5 transition-all ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Header Section */}
      <Paper
        elevation={3}
        sx={{
          padding: 2,
          marginBottom: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">⚡ Live React Code Editor with MUI</Typography>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Button
            onClick={addNewFile}
            variant="contained"
            color="primary"
            startIcon={<Plus />}
          >
            Add File
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sun size={16} />
            <Switch checked={darkMode} onChange={toggleTheme} />
            <Moon size={16} />
          </div>
        </div>
      </Paper>

      {/* Module Status & Errors */}
      {isLoading && (
        <Paper sx={{ padding: 1, marginBottom: 2, background: "#f8f9fa" }}>
          <Typography color="primary">Loading modules...</Typography>
        </Paper>
      )}

      {error && (
        <Paper sx={{ padding: 1, marginBottom: 2, background: "#fff0f0" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {Object.keys(loadedModules).length > 0 && (
        <Paper sx={{ padding: 1, marginBottom: 2, background: "#f0f4ff" }}>
          <Typography variant="subtitle2">
            Loaded modules: {Object.keys(loadedModules).join(", ")}
          </Typography>
        </Paper>
      )}

      {/* File Tabs */}
      <div className="flex space-x-2 overflow-x-auto border-b border-gray-700 pb-2 mb-3">
        {files.map((file, index) => (
          <Paper
            key={index}
            sx={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              background: code === file.content ? "#1976d2" : "#666666",
              color: "white",
              cursor: "pointer",
              borderRadius: "5px",
            }}
            onClick={() => setCode(file.content)}
          >
            {file.name}
            {index > 0 && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(index);
                }}
                sx={{ marginLeft: 1, color: "white" }}
              >
                <Delete size={16} />
              </IconButton>
            )}
          </Paper>
        ))}
      </div>

      {/* Code Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CodeMirror Editor */}
        <Paper sx={{ padding: 2, borderRadius: "5px" }}>
          <CodeMirror
            value={code}
            height="300px"
            theme={darkMode ? "dark" : "light"}
            extensions={[basicSetup(), javascript()]}
            onChange={(newCode) => setCode(newCode)}
          />
        </Paper>

        {/* Live Preview with React Live */}
        <Paper
          sx={{
            padding: 2,
            minHeight: "300px",
            backgroundColor: darkMode ? "#1e1e1e" : "#f5f5f5",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          <LiveProvider
            code={processedCode}
            scope={createScope()}
            noInline={true} // Change noInline to true to avoid issues with rendering
          >
            <LivePreview />
            <LiveError />
          </LiveProvider>
        </Paper>
      </div>
    </div>
  );
}