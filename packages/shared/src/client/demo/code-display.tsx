import { useState } from "react";
import styles from "./demo.module.scss";
import { Editor } from "react-live";

interface CodeDisplayProps {
  code: { filename: string; code: string }[];
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <details className={styles.codeDisplay}>
      <summary>
        <span className={styles.show}>Show</span>
        <span className={styles.hide}>Hide</span>
        &nbsp;Code
      </summary>
      <div className={styles.tabs}>
        {code.map((item, index) => (
          <button
            key={item.filename}
            className={selectedTab === index ? styles.active : ""}
            onClick={() => setSelectedTab(index)}>
            {item.filename}
          </button>
        ))}
      </div>
      <div className={styles.codeContainer}>
        <button
          className={styles.copy}
          title="copy"
          onClick={() => navigator.clipboard.writeText(code[selectedTab].code)}>
          📋
        </button>
        <Editor className={styles.code} code={code[selectedTab].code} language="tsx" />
      </div>
    </details>
  );
}
