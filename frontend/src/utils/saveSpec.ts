import { BACKEND_HTTP_URL } from "../config";

// Define the spec shape
export interface Spec {
  name: string;
  description: string;
  parameters: any[];
}

// Generic save function
export const saveSpec = async (
  spec: Spec,
  handleToast: (msg: string, severity?: "success" | "error") => void
): Promise<Spec | null> => {
  if (!spec.name.trim()) {
    handleToast("Name is required", "error");
    return null;
  }
  if (!spec.description.trim()) {
    handleToast("Description is required", "error");
    return null;
  }
  if (!Array.isArray(spec.parameters) || spec.parameters.length === 0) {
    handleToast("At least one parameter is required", "error");
    return null;
  }

  try {
    const res = await fetch(`${BACKEND_HTTP_URL}/configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    // Attach the backend ID to spec
    const savedSpec = { ...spec, id: data.id };

    handleToast(`Saved config with ID: ${data.id}`, "success");
    return savedSpec;
  } catch (err: any) {
    handleToast(`Error saving config: ${err.message}`, "error");
    return null;
  }
};
