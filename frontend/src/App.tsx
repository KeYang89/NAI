import React, { useState, createContext } from "react";
import { Container, Typography, Paper, Snackbar, Alert, Box, Grid } from "@mui/material";
import SpecForm from "./components/SpecForm";
import JsonPreview from "./components/JsonPreview";
import SavedConfigLoader from "./components/SavedConfigLoader";
import ProgressBar from "./components/ProgressBar";
import UploadJSON from "./components/UploadJSON";
import PlotConfig from "./components/PlotConfig"; // <-- Our plotting component
import { saveSpec } from "./utils/saveSpec";

// Context to share spec across components
export const SpecContext = createContext<any>(null);

function App() {
  const [specJson, setSpecJson] = useState<any>(null);
  const [loadedConfigs, setLoadedConfigs] = useState<any[]>([]);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleToast = (message: string, severity: "success" | "error" = "success") => {
    setToast({ open: true, message, severity });
  };

  const closeToast = () => setToast({ ...toast, open: false });

  // Function for loaders to push configs up
  const handleConfigLoad = (configs: any | any[]) => {
    const arr = Array.isArray(configs) ? configs : [configs];

    // Update loadedConfigs
    setLoadedConfigs((prev) => [...prev, ...arr]);

    // Update specJson to the first loaded config (for JSON preview / default plot)
    if (arr.length > 0) setSpecJson(arr[0]);

    handleToast(`Loaded ${arr.length} config(s)`, "success");
  };

  // Remove from UI
  const removeConfig = (configId: string) => {
    setLoadedConfigs((prev) => prev.filter((cfg) => cfg.id !== configId));
  };

  // Unified save function
  const handleSave = (config: any) => {
    saveSpec(config, setSpecJson, handleToast);

    // Update loadedConfigs: replace if same id exists, else add
    setLoadedConfigs((prev) => {
      if (!config.id) return prev; // safety check
      const exists = prev.some((c) => c.id === config.id);
      if (exists) {
        return prev.map((c) => (c.id === config.id ? config : c));
      } else {
        return [...prev, config];
      }
    });
  };

  return (
    <SpecContext.Provider value={{ 
        specJson, 
        setSpecJson, 
        handleToast,
        loadedConfigs,
        setLoadedConfigs
      }}>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Parameter Sweep UI
        </Typography>

        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            {/* Form to edit and save parameters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <SpecForm />
            </Paper>

            {/* Upload & edit JSON */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <UploadJSON onLoad={handleConfigLoad} onSave={handleSave} />
            </Paper>

            {/* Load saved configs */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <SavedConfigLoader onLoad={handleConfigLoad} />
            </Paper>

            {/* Progress Bars */}
            <Paper sx={{ p: 2 }}>
              {loadedConfigs.length > 0 ? (
                loadedConfigs.map((cfg, idx) => (
                  <Box key={cfg.id || idx} sx={{ mb: 4 }}>
                    <Typography variant="h6">Chart {idx + 1}</Typography>
                    <ProgressBar configId={cfg.id} />
                  </Box>
                ))
              ) : (
                <Typography>No configurations loaded</Typography>
              )}
            </Paper>

          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            {/* JSON preview */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <JsonPreview json={specJson} />
            </Paper>

            {/* Plots  */}
            <Paper sx={{ p: 2 }}>
              {loadedConfigs.length > 0 ? (
                loadedConfigs.map((cfg, idx) => (
                  <Box key={cfg.id || idx} sx={{ mb: 4 }}>
                    <Typography variant="h6">Chart {idx + 1}</Typography>
                    <PlotConfig
                      config={cfg}
                      onRemove={(id) => setLoadedConfigs((prev) => prev.filter((c) => c.id !== id))}
                    />
                  </Box>
                ))
              ) : (
                <Typography>No configurations loaded</Typography>
              )}
            </Paper>

          </Grid>
        </Grid>

        {/* Snackbar for save/load notifications */}
        <Snackbar open={toast.open} autoHideDuration={3000} onClose={closeToast}>
          <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Container>
    </SpecContext.Provider>
  );
}

export default App;
