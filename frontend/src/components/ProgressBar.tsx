import React, { useState, useEffect } from "react";
import { LinearProgress, Typography, Box } from "@mui/material";
import { BACKEND_WS_URL } from "../config";

interface ProgressBarProps {
  configId: string;
}

export default function ProgressBar({ configId }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState("IDLE");
  const [viewers, setViewers] = useState(1);

  useEffect(() => {
    const ws = new WebSocket(`${BACKEND_WS_URL}/ws/configs/${configId}`);

    ws.onopen = () => console.log(`Connected to progress WS for ${configId}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      setState(data.state);
      setViewers(data.viewers || 1);
    };
    ws.onclose = () => console.log(`WebSocket closed for ${configId}`);
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close(); // cleanup on unmount
  }, [configId]);

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        ID: {configId} — Progress: {progress}% — {state} — Viewers: {viewers}
      </Typography>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
}
