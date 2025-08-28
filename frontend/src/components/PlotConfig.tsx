import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, TextField, MenuItem, Button, FormControlLabel, Checkbox } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PlotConfigProps {
  config: any;
  onRemove: (id: string) => void;
}

export default function PlotConfig({ config, onRemove }: PlotConfigProps) {
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [objective, setObjective] = useState<string>("y");
  const [useNumericX, setUseNumericX] = useState<boolean>(false);
  const [plotData, setPlotData] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!config?.parameters || !xAxis || !yAxis) return;

    let xValues: number[] = [];
    let yParam = config.parameters.find((p: any) => p.key === yAxis);

    if (!yParam) return;

    if (useNumericX) {
      // generate index [0,1,2,...] up to length of y-values
      xValues = Array.from({ length: yParam.values.length }, (_, i) => i);
    } else {
      const xParam = config.parameters.find((p: any) => p.key === xAxis);
      if (!xParam) return;
      xValues = xParam.values;
    }

    const len = Math.min(xValues.length, yParam.values.length);
    const data: any[] = [];

    for (let i = 0; i < len; i++) {
      const x = xValues[i];
      const y = yParam.values[i];
      let objValue = y;

      if (objective && objective.trim() !== "y") {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function("x", "y", `return ${objective}`);
          objValue = fn(x, y);
          if (typeof objValue !== "number" || isNaN(objValue)) objValue = 0;
        } catch (e: any) {
          setError("Error evaluating objective function: " + e.message);
          objValue = 0;
        }
      }

      data.push({ x, y, obj: objValue });
    }

    setPlotData(data);
    if (!error) setError("");
  }, [config, xAxis, yAxis, objective, useNumericX]);

  if (!config?.parameters) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>No parameters available. Add or load a config.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Parameter Sweep Plot: {config.id || "Unnamed"}</Typography>
        <Button color="error" size="small" onClick={() => onRemove(config.id)}>
          Remove Plot
        </Button>
      </Box>

      {/* Axis selectors */}
      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
        <TextField
          select
          label="X-axis"
          value={xAxis}
          onChange={(e) => setXAxis(e.target.value)}
          fullWidth
          disabled={useNumericX} // disable when using numeric index
        >
          {config.parameters.map((p: any) => (
            <MenuItem key={p.key} value={p.key}>
              {p.key}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Y-axis"
          value={yAxis}
          onChange={(e) => setYAxis(e.target.value)}
          fullWidth
        >
          {config.parameters.map((p: any) => (
            <MenuItem key={p.key} value={p.key}>
              {p.key}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <FormControlLabel
        control={<Checkbox checked={useNumericX} onChange={(e) => setUseNumericX(e.target.checked)} />}
        label="Use numeric index for X-axis"
      />

      {/* Objective function input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Objective function (use x and y)"
          fullWidth
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          helperText="Example: y, x + y*2, Math.sin(x)+Math.log(y+1)"
          error={!!error}
        />
      </Box>

      {/* Plot */}
      {plotData.length > 0 ? (
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="x" stroke="#82ca9d" name={useNumericX ? "Index" : xAxis} />
              <Line type="monotone" dataKey="y" stroke="#8884d8" name={yAxis} />
              <Line type="monotone" dataKey="obj" stroke="#ff7300" name="Objective" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Typography>Select X and Y axes to display the plot.</Typography>
      )}
    </Paper>
  );
}
