import { useRef, useState } from 'react';
import { Box, Button, Typography, Paper, TextField } from '@mui/material';

interface UploadJSONProps {
  onLoad: (config: any) => void;
  onSave?: (config: any) => void;
}

export default function UploadJSON({ onLoad, onSave }: UploadJSONProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualJson, setManualJson] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fileContent, setFileContent] = useState<string | null>(null);

  const validateConfig = (config: any) => {
    if (!config.name) return "Missing 'name' field";
    if (!config.description) return "Missing 'description' field";
    if (!Array.isArray(config.parameters)) return "'parameters' must be an array";
    return null;
  };

  const handleLoadJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const validationError = validateConfig(parsed);
      if (validationError) {
        setError(validationError);
        return;
      }
      onLoad(parsed);
      setError('');
      return parsed;
    } catch (e: any) {
      setError("Invalid JSON: " + e.message);
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target?.result as string);
      setManualJson(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleLoadClick = () => {
    // can put more verification logic here. 
    // keep it simple for now.
    const jsonStr = fileContent || manualJson;
    const parsed = handleLoadJSON(jsonStr);
    if (parsed && onSave) onSave(parsed);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload or Edit JSON Config
      </Typography>

      <TextField
        label="Manual JSON Edit"
        multiline
        minRows={8}
        fullWidth
        value={manualJson}
        onChange={(e) => setManualJson(e.target.value)}
        error={!!error}
        helperText={error || 'Paste or type JSON config here'}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose File
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLoadClick}
        >
          Verify JSON
        </Button>
        {onSave && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleLoadClick()}
          >
            Save JSON
          </Button>
        )}
      </Box>

      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Paper>
  );
}
