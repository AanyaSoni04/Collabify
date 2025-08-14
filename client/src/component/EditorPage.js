import Client from "./Client";
import Editor from "./Editor";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
function EditorPage() {
  const [clients, setClient] = useState([
    { socketId: 1, username: "Aanya" },
    { socketId: 2, username: "Rishu" },
  ]);
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0,0,0,0.1)" }}
        >
          <img
            src="/images/codecast.png"
            alt="CodeCast"
            className="img-fluid mx-auto"
            style={{ maxWidth: "200px", marginTop: "-40px" }}
          />
          <hr style={{ marginTop: "-3rem" }} />

          {/* client list container */}
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          {/* buttons */}
          <div className="mt-auto">
            <hr />
            <button className="btn btn-success">Copy Room Id</button>
            <button className="btn btn-danger mt-2 mb-2 px-3 btn-block">
              Leave Room
            </button>
          </div>
        </div>

        {/* editor */}
        <div className="col-md-10 text-light d-flex flex-column h-100">
          <Editor></Editor>
        </div>
      </div>
    </div>
  );
}

export default EditorPage
