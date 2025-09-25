import React, { useRef, useEffect } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets"

function Editor({ socketRef ,roomId }) {
  const editorRef = useRef(null);
  useEffect(()=>{
    const init = async () => {
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
      editorRef.current.on("change", (instance, changes) => {
        // console.log("changes", instance ,  changes );
        const { origin } = changes;
        const code = instance.getValue(); // code has value which we write
        if (origin !== "setValue") {
          socketRef.current.emit("code-change", {
            roomId,
            code,
          });
        }
      });
     
    };
    init();
  },[]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('code-change', ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }
    return () => {
      socketRef.current.off("code-change");
    };
  }, [socketRef.current]);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
}

export default Editor;
