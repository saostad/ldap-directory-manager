import path from "path";

export const variables = {
  defaultJsonDir: path.join(process.cwd(), "generated", "json"),
  defaultInterfaceDir: path.join(
    process.cwd(),
    "src",
    "generated",
    "interfaces",
  ),
};
