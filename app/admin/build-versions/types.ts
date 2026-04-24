export type BuildVersionFormMode = "new_build" | "existing_build";

export type BuildVersionFormState = {
  ok: boolean;
  message: string;
  values?: {
    mode?: BuildVersionFormMode;
    buildId?: string;
    shortCode?: string;
    modelId?: string;
    packageId?: string;
    stateSnapshot?: string;
  };
  errors?: {
    mode?: string;
    buildId?: string;
    shortCode?: string;
    modelId?: string;
    packageId?: string;
    stateSnapshot?: string;
    form?: string;
  };
};

export const initialBuildVersionFormState: BuildVersionFormState = {
  ok: false,
  message: "",
  values: {
    mode: "new_build",
    buildId: "",
    shortCode: "",
    modelId: "",
    packageId: "",
    stateSnapshot: "",
  },
};

export type BuildCurrentVersionFormState = {
  ok: boolean;
  message: string;
  errors?: {
    buildId?: string;
    versionId?: string;
    form?: string;
  };
};

export const initialBuildCurrentVersionFormState: BuildCurrentVersionFormState = {
  ok: false,
  message: "",
};