"use client";
import { ApiForm } from "./api-form";

type Opt = { value: string; label: string };

export function TeamForm({ roles, branches }: { roles: Opt[]; branches: Opt[] }) {
  return (
    <ApiForm
      endpoint="/api/team"
      submitLabel="Add team member"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "password", label: "Temporary password", type: "password", required: true },
        { name: "role", label: "Role", type: "select", options: roles, required: true },
        { name: "allBranches", label: "Access all branches", type: "checkbox" },
        { name: "branchId", label: "Or only this branch", type: "select", options: [{ value: "", label: "-" }, ...branches] },
      ]}
      transform={({ branchId, ...rest }) => ({ ...rest, allBranches: !!rest.allBranches, branchIds: branchId ? [branchId] : [] })}
    />
  );
}
