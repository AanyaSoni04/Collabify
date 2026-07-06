import React, { useRef, useEffect } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets"
/* eslint-disable react-hooks/exhaustive-deps */

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);
  const onCodeChangeRef = useRef(onCodeChange);

  // Keep onCodeChangeRef updated with the latest callback
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    // 1. Initialize CodeMirror editor synchronously
    const editor = CodeMirror.fromTextArea(
      document.getElementById("realTimeEditor"),
      {
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      }
    );

    editorRef.current = editor;
    editor.setSize(null, "100%");

    // 2. Set up editor change listener
    editor.on("change", (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();
      onCodeChangeRef.current(code);

      if (origin !== "setValue") {
        socketRef.current?.emit("code-change", {
          roomId,
          code,
        });
      }
    });

    // 3. Set up socket listener
    const socket = socketRef.current;
    if (socket) {
      socket.on("code-change", ({ code }) => {
        if (code !== null && editorRef.current) {
          // Check if value is different to avoid cursor jumping / feedback loop
          if (editorRef.current.getValue() !== code) {
            const cursor = editorRef.current.getCursor();
            editorRef.current.setValue(code);
            editorRef.current.setCursor(cursor);
          }
        }
      });
    }

    // 4. Cleanup function
    return () => {
      if (socket) {
        socket.off("code-change");
      }
      if (editorRef.current) {
        editorRef.current.toTextArea(); // Properly clean up CodeMirror instance
      }
    };
  }, [socketRef, roomId]);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
}

export default Editor;
