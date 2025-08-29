import { useState, useContext } from "react";
import { Box, Button, TextField, Paper, Typography, IconButton, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { SpecContext } from "../App";
import { v4 as uuidv4 } from "uuid";
import { saveSpec, Spec } from "../utils/saveSpec";

interface Parameter {
  id: string; // unique per parameter
  key: string;
  type: "float" | "int" | "enum";
  values: any[];
}

export default function SpecForm() {
  const { specJson, setSpecJson, handleToast, loadedConfigs, setLoadedConfigs } = useContext(SpecContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [rawValues, setRawValues] = useState<{ [id: string]: string }>({});
  const [errors, setErrors] = useState<{ [id: string]: string }>({});
  const [useGenerator, setUseGenerator] = useState<{ [id: string]: boolean }>({});
  const [genStart, setGenStart] = useState<{ [id: string]: string }>({});
  const [genEnd, setGenEnd] = useState<{ [id: string]: string }>({});
  const [genStep, setGenStep] = useState<{ [id: string]: string }>({});
  const [genFunc, setGenFunc] = useState<{ [id: string]: string }>({}); // NEW for function

  const addParameter = () => {
    const id = uuidv4();
    setParameters([...parameters, { id, key: "", type: "float", values: [] }]);
    setRawValues({ ...rawValues, [id]: "" });
    setErrors({ ...errors, [id]: "" });
    setUseGenerator({ ...useGenerator, [id]: false });
    setGenStart({ ...genStart, [id]: "" });
    setGenEnd({ ...genEnd, [id]: "" });
    setGenStep({ ...genStep, [id]: "" });
    setGenFunc({ ...genFunc, [id]: "" });
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter((p) => p.id !== id));
    const { [id]: _, ...restRaw } = rawValues;
    const { [id]: __, ...restErr } = errors;
    const { [id]: ___, ...restUseGen } = useGenerator;
    const { [id]: ____, ...restStart } = genStart;
    const { [id]: _____, ...restEnd } = genEnd;
    const { [id]: ______, ...restStep } = genStep;
    const { [id]: _______, ...restFunc } = genFunc;
    setRawValues(restRaw);
    setErrors(restErr);
    setUseGenerator(restUseGen);
    setGenStart(restStart);
    setGenEnd(restEnd);
    setGenStep(restStep);
    setGenFunc(restFunc);
  };

  const updateParameterField = (id: string, field: keyof Parameter, value: any) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updateRawValue = (id: string, value: string) => {
    setRawValues({ ...rawValues, [id]: value });
    setErrors({ ...errors, [id]: "" });
  };

  const commitValues = (id: string) => {
    const raw = rawValues[id];
    const param = parameters.find((p) => p.id === id);
    if (!param) return;
    const type = param.type;
    const parsed = raw.split(",").map((v) => v.trim());

    for (let v of parsed) {
      if (type === "float" && isNaN(parseFloat(v))) {
        setErrors({ ...errors, [id]: "Must be a float" });
        return;
      }
      if (type === "int" && !/^-?\d+$/.test(v)) {
        setErrors({ ...errors, [id]: "Must be an integer" });
        return;
      }
    }

    const finalValues = parsed.map((v) =>
      type === "float" ? parseFloat(v) : type === "int" ? parseInt(v, 10) : v
    );
    updateParameterField(id, "values", finalValues);
    setErrors({ ...errors, [id]: "" });
  };

  const generateList = (id: string) => {
    const s = parseFloat(genStart[id]);
    const e = parseFloat(genEnd[id]);
    const st = parseFloat(genStep[id]);
    const funcStr = genFunc[id];

    if (isNaN(s) || isNaN(e) || (isNaN(st) && !funcStr) || (st <= 0 && !funcStr)) {
      handleToast("Invalid start/end/step", "error");
      return;
    }

    const list: number[] = [];

    try {
      if (funcStr) {
        // Create a safe function with x
        const f = new Function("x", `"use strict"; return (${funcStr});`);
        const points = st > 0 ? Math.ceil((e - s) / st) : 100;
        const step = (e - s) / points;
        for (let x = s; x <= e + 1e-9; x += step) {
          const val = f(x);
          if (typeof val === "number" && !isNaN(val)) list.push(val);
        }
      } else {
        for (let v = s; v <= e + 1e-9; v += st) {
          list.push(Math.round(v * 1e12) / 1e12);
        }
      }
    } catch (err) {
      handleToast("Invalid function: " + err, "error");
      return;
    }

    setRawValues({ ...rawValues, [id]: list.join(",") });
    updateParameterField(id, "values", list);
    setErrors({ ...errors, [id]: "" });
  };


  const handleSave = async () => {
    if (!name.trim()) {
      handleToast("Name is required", "error");
      return;
    }
    if (!description.trim()) {
      handleToast("Description is required", "error");
      return;
    }
    if (parameters.length === 0) {
      handleToast("At least one parameter is required", "error");
      return;
    }

    for (const p of parameters) {
      if (!p.values || p.values.length === 0) {
        handleToast(`Parameter "${p.key}" has no values`, "error");
        return;
      }
    }

    const spec = { name, description, parameters };
    const saved = await saveSpec(spec, handleToast);

    if (!saved) return;

    setSpecJson(saved);
    setLoadedConfigs([saved]);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Specification Form</Typography>

      <TextField
        label="Name"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ my: 1 }}
      />
      <TextField
        label="Description"
        fullWidth
        multiline
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ my: 1 }}
      />

      <Box>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Parameters
        </Typography>
        {parameters.map((p) => (
          <Box key={p.id} sx={{ display: "flex", flexDirection: "column", gap: 1, my: 1 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label="Key"
                value={p.key}
                onChange={(e) => updateParameterField(p.id, "key", e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Type"
                value={p.type}
                onChange={(e) => updateParameterField(p.id, "type", e.target.value)}
                sx={{ width: 120 }}
              >
                {["float", "int", "enum"].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Values (comma-separated)"
                value={rawValues[p.id] || ""}
                onChange={(e) => updateRawValue(p.id, e.target.value)}
                onBlur={() => commitValues(p.id)}
                error={!!errors[p.id]}
                helperText={errors[p.id] || ""}
                sx={{ flex: 2 }}
              />

              <IconButton
                aria-label="toggle-generator"
                onClick={() =>
                  setUseGenerator({ ...useGenerator, [p.id]: !useGenerator[p.id] })
                }
              >
                <AddIcon />
              </IconButton>

              <IconButton aria-label="delete-parameter" onClick={() => removeParameter(p.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            {useGenerator[p.id] && (
              <Box sx={{ display: "flex", gap: 1, mt: 1, width: "100%", flexWrap: "wrap" }}>
                <TextField
                  label="Start"
                  type="number"
                  value={genStart[p.id] || ""}
                  onChange={(e) => setGenStart({ ...genStart, [p.id]: e.target.value })}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="End"
                  type="number"
                  value={genEnd[p.id] || ""}
                  onChange={(e) => setGenEnd({ ...genEnd, [p.id]: e.target.value })}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Step"
                  type="number"
                  value={genStep[p.id] || ""}
                  onChange={(e) => setGenStep({ ...genStep, [p.id]: e.target.value })}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Function (x => ...)"
                  value={genFunc[p.id] || ""}
                  onChange={(e) => setGenFunc({ ...genFunc, [p.id]: e.target.value })}
                  sx={{ width: 200 }}
                  placeholder="e.g., Math.sin(x)"
                />
                <Button variant="outlined" onClick={() => generateList(p.id)}>
                  Gen
                </Button>
              </Box>
            )}
          </Box>
        ))}

        <Button startIcon={<AddIcon />} onClick={addParameter} sx={{ mt: 1 }}>
          Add Parameter
        </Button>
      </Box>

      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Config
        </Button>
      </Box>
    </Paper>
  );
}
