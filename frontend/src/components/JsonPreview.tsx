import { Box, Typography, Paper } from '@mui/material';

interface JsonPreviewProps {
  json: any;
}

export default function JsonPreview({ json }: JsonPreviewProps) {
  if (!json) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No data to display.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto', bgcolor: '#f9f9f9' }}>
      <Typography variant="h6" gutterBottom>
        JSON Preview
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          fontSize: 14,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(json, null, 2)}
      </Box>
    </Paper>
  );
}