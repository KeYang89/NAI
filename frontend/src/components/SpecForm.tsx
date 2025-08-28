import { useState, useContext, useEffect } from "react";
import { Box, Button, TextField, Paper, Typography, IconButton, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { SpecContext } from "../App";
import { saveSpec } from "../utils/saveSpec";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

interface Parameter {
  key: string;
  type: "float" | "int" | "enum";
  values: any[];
}

export default function SpecForm() {
  const { specJson, setSpecJson, handleToast, loadedConfigs, setLoadedConfigs } = useContext(SpecContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [rawValues, setRawValues] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]); // track inline errors

  // Sync rawValues when parameters change
  useEffect(() => {
    setRawValues(parameters.map((p) => p.values.join(",")));
    setErrors(parameters.map(() => "")); // reset errors
  }, [parameters]);

  const addParameter = () => {
    setParameters([...parameters, { key: "", type: "float", values: [] }]);
    setRawValues([...rawValues, ""]);
    setErrors([...errors, ""]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
    setRawValues(rawValues.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const updateParameterField = (index: number, field: keyof Parameter, value: any) => {
    const newParams = [...parameters];
    newParams[index][field] = value;
    setParameters(newParams);
  };

  const updateRawValue = (index: number, value: string) => {
    const newRaw = [...rawValues];
    newRaw[index] = value;
    setRawValues(newRaw);

    // reset error on change
    const newErrors = [...errors];
    newErrors[index] = "";
    setErrors(newErrors);
  };

  const commitValues = (index: number) => {
    const raw = rawValues[index];
    const type = parameters[index].type;
    const parsed = raw.split(",").map((v) => v.trim());

    const newErrors = [...errors];
    for (let v of parsed) {
      if (type === "float") {
        if (isNaN(parseFloat(v))) {
          newErrors[index] = `Must be a float`;
          setErrors(newErrors);
          return; // do not commit invalid values
        }
      } else if (type === "int") {
        if (!/^-?\d+$/.test(v)) {
          newErrors[index] = `Must be an integer`;
          setErrors(newErrors);
          return;
        }
      }
      // enums accept any string
      // To-do: validate enum values against a predefined list so the user can only select allowed strings
    }

    const finalValues = parsed.map((v) =>
      type === "float" ? parseFloat(v) : type === "int" ? parseInt(v, 10) : v
    );

    updateParameterField(index, "values", finalValues);
    newErrors[index] = ""; // clear error if valid
    setErrors(newErrors);
  };

  const handleSave = async () => {
    // ensure all parameters are valid
    for (let i = 0; i < parameters.length; i++) {
      if (!parameters[i].values || parameters[i].values.length === 0) {
        handleToast(`Parameter "${parameters[i].key}" has no values`, "error");
        return;
      }
      if (errors[i]) {
        handleToast(`Parameter "${parameters[i].key}" has invalid values`, "error");
        return;
      }
    }

    const newSpec = { id: uuidv4(), name, description, parameters };
    
    // Save JSON preview
    setSpecJson(newSpec);

    // Clear previous plots and add the new spec
    setLoadedConfigs([newSpec]);

    handleToast("Config saved and plot updated", "success");
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
        {parameters.map((p, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1, my: 1, alignItems: "center" }}>
            <TextField
              label="Key"
              value={p.key}
              onChange={(e) => updateParameterField(i, "key", e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Type"
              value={p.type}
              onChange={(e) => updateParameterField(i, "type", e.target.value)}
              sx={{ width: 120 }}
            >
              {["float", "int", "enum"].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Values (comma-separated)"
              value={rawValues[i] || ""}
              onChange={(e) => updateRawValue(i, e.target.value)}
              onBlur={() => commitValues(i)}
              sx={{ flex: 2 }}
              error={!!errors[i]}
              helperText={errors[i] || ""}
            />

            <IconButton onClick={() => removeParameter(i)}>
              <DeleteIcon />
            </IconButton>
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
