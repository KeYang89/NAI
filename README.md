# Parameter‑Sweep Configurator App

This app is a MVP that lets engineers define parameter sweeps—sets of CFD/FEA simulations to
explore different input combinations. It creates, stores, plots, and previews the sweeps. 
Parameters are used to represent properties of the geometry being analyzed, such as the span, 
dihedral, and airfoil profile of a wing.


## What is a Parameter Sweep?

- A parameter sweep is essentially running many simulations or analyses while systematically varying one or more input parameters.

- Parameters: variables you control in your simulation.

- CFD (Computational Fluid Dynamics) example: inlet velocity, turbulence intensity, temperature, geometry size.

- FEA (Finite Element Analysis) example: material modulus, applied force, mesh density.

- Sweep: changing these parameters across a defined range and observing the effect on outputs (flow patterns, stresses, displacements).


## Why use Parameter Sweeps?

- Design optimization: find which parameters give the best performance (e.g., lowest drag, minimal stress).

- Sensitivity analysis: see which inputs have the largest effect on the outputs.

- Robustness checks: ensure your system works under a range of conditions.

- Data for ML models: generate training datasets for surrogate models or AI predictions.


## Example Specs:
```
{
  "name": "Baseline sweep",
  "description": "Trying different AoA & speeds",
  "parameters": [
    { "key": "angle_of_attack", "type": "float", "values": [0, 2.5, 5, 7.5, 10] },
    { "key": "speed", "type": "float", "values": [20, 40, 60] },
    { "key": "turbulence_model", "type": "enum", "values": ["k-epsilon", "k-omega"] }
  ]
}
```
name: identifies the sweep.

description: optional human-readable summary.

parameters: list of variables to sweep. Each has:

- key: parameter name used in the simulation input. 

- type: "float", "int", or "enum" (enumerated choice).

- values: the discrete values to test.


# Structure

```
param-sweep-configurator/
├─ backend/
│  ├─ screenshots/
│  ├─ requirements.txt
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ models.py
│  │  └─ storage.py
│  └─ README.md
├─ frontend/
│  ├─ screenshots/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ utils/
│     │  └─ saveSpec.ts
│     ├─ components/
│     │  ├─ SpecForm.tsx
│     │  ├─ JsonPreview.tsx
│     │  ├─ UploadJSON.tsx
│     │  ├─ SavedConfigLoader.tsx
│     │  └─ ProgressBar.tsx
│     └─ styles.css
├─ config/.env.shared
└─ README.md
```


# Run Backend:

```bash

cd param-sweep-configurator-app/backend/
python3 -m venv .venv
source .venv/bin/activate #  or .venv\Scripts\activate on Windows
pip3 install -r requirements.txt
python3 -m app.run # it will get port from .env file or find a free port

```

Backend runs at the end point displayed in the console, for example:

`http://localhost:53045/docs`

This shows all your endpoints (/configs, /ws/configs/{id}) and lets you test them interactively.

If you prefer redoc:

`http://0.0.0.0:53045/redoc`

If you see CORS errors, install CORS support on backend:

```bash

pip install flask-cors

```

and add:

```
from flask_cors import CORS
CORS(app)

```

# Run Frontend

```bash

cd param-sweep-configurator-app/frontend/
npm install
npm run dev

```
React frontend runs at http://localhost:5173


# Notes

This app uses Redis to persist results.

WebSocket setup in this app is for streaming progress updates for long-running jobs, display the progress to multiple users, but not for collaborative editing. Each time a user creates a new spec, the backend generates a unique UUID. The WebSocket is tied to that ID and streams progress updates for that specific job.