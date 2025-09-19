import { readFileSync } from "node:fs";
import { CodeDisplay, Demo } from "@repo/shared";
import { LandingPage } from "@repo/shared/dist/server";
import type { ReactNode } from "react";
import { DownloadDocxFromAPI } from "./download-from-api";

export const metadata = {
  title: "MDAST (Markdown Abstract Syntax Tree) to DOCX",
};

const code: { filename: string; code: string }[] = [
  {
    filename: "/api/docx/route.ts",
    code: readFileSync("./src/app/api/docx/route.ts", "utf-8"),
  },
  {
    filename: "/download-from-api.tsx",
    code: readFileSync("./src/app/download-from-api.tsx", "utf-8"),
  },
];

/** next.js landing page */
export default function Page(): ReactNode {
  return (
    <LandingPage title="Next.js Example">
      <Demo />
      <div className="demo">
        <br />
        <DownloadDocxFromAPI />
        <CodeDisplay code={code} />
      </div>
    </LandingPage>
  );
}
