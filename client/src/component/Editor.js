import React, { useRef, useEffect } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import * as Y from "yjs";
import { CodemirrorBinding } from "y-codemirror";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";
/* eslint-disable react-hooks/exhaustive-deps */

// Assigns a random bright color to each user's remote cursor caret
const getRandomColor = () => {
  const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3", 
    "#33FFF3", "#FFA833", "#AF33FF", "#33FFA8", "#FF3333"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

function Editor({ socketRef, roomId, username, onCodeChange }) {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const onCodeChangeRef = useRef(onCodeChange);

  // Keep onCodeChangeRef updated with the latest callback
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    // 1. Initialize CodeMirror editor
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

    // 2. Initialize Yjs Document and Binding
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("codemirror");
    
    // Create Awareness instance for tracking user cursors & selections
    const awareness = new Awareness(ydoc);
    awareness.setLocalState({
      user: {
        name: username || "Anonymous",
        color: getRandomColor(),
      }
    });

    // Bind Yjs shared type and CodeMirror editor
    const binding = new CodemirrorBinding(ytext, editor, awareness);
    bindingRef.current = binding;

    // 3. Track editor changes (for parent state codeRef)
    ytext.observe(() => {
      const code = ytext.toString();
      onCodeChangeRef.current(code);
    });

    // 4. Set up socket connection and event synchronization
    const socket = socketRef.current;
    if (socket) {
      // Send local Yjs document updates to the server
      ydoc.on("update", (update, origin) => {
        if (origin !== "socket") {
          socket.emit("code-update", { roomId, update });
        }
      });

      // Send local awareness changes (cursor movements, selection updates)
      awareness.on("update", ({ added, updated, removed }) => {
        const changedClients = added.concat(updated).concat(removed);
        const update = encodeAwarenessUpdate(awareness, changedClients);
        socket.emit("awareness-update", { roomId, update });
      });

      // Receive initial room document state upon joining
      socket.on("init-doc-state", (docState) => {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(docState), "socket");
        } catch (err) {
          console.error("Error applying initial doc state:", err);
        }
      });

      // Receive real-time document delta updates from other users
      socket.on("code-update", (update) => {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update), "socket");
        } catch (err) {
          console.error("Error applying incoming code update:", err);
        }
      });

      // Receive real-time awareness updates (cursors, selections)
      socket.on("awareness-update", (update) => {
        try {
          applyAwarenessUpdate(awareness, new Uint8Array(update), "socket");
        } catch (err) {
          console.error("Error applying incoming awareness update:", err);
        }
      });
    }

    // 5. Cleanup
    return () => {
      if (socket) {
        socket.off("init-doc-state");
        socket.off("code-update");
        socket.off("awareness-update");
      }
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      awareness.destroy();
      ydoc.destroy();
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, [socketRef, roomId, username]);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
}

export default Editor;
