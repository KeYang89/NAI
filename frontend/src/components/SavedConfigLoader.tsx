import { useState, useContext } from "react";
import { Button, TextField, Paper, Typography } from "@mui/material";
import { BACKEND_HTTP_URL } from "../config";
import { SpecContext } from "../App";

interface SavedConfigLoaderProps {
  onLoad: (configs: any[]) => void;
}

export default function SavedConfigLoader({ onLoad  }: SavedConfigLoaderProps) {
  const [idInput, setIdInput] = useState("");
  const { handleToast } = useContext(SpecContext); 
  const handleLoadByIds = async () => {
    const ids = idInput.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      handleToast("Please enter at least one ID", "error");
      return;
    }

    try {
      const configs: any[] = [];
      for (const id of ids) {
        const res = await fetch(`${BACKEND_HTTP_URL}/configs/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch ID ${id}`);
        configs.push(await res.json());
      }
      //onLoad(configs); // allow multiple configs to be plotted, TO DO
      onLoad(configs[0]); // only pass the first config for plotting
      handleToast(`Loaded ${configs.length} config(s)`, "success");
    } catch (err: any) {
      handleToast(`Error: ${err.message}`, "error");
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Load Saved Config
      </Typography>
      <TextField
        label="Enter config id, each entry would append to the last"
        value={idInput}
        onChange={(e) => setIdInput(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleLoadByIds}>
        Load by id
      </Button>
    </Paper>
  );
}
