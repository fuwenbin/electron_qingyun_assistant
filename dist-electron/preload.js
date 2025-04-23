"use strict";const t=require("electron");window.addEventListener("DOMContentLoaded",()=>{const n=(e,r)=>{const o=document.getElementById(e);o&&(o.innerText=r)};for(const e of["chrome","node","electron"])n(`${e}-version`,process.versions[e])});t.contextBridge.exposeInMainWorld("electronAPI",{saveVideo:n=>t.ipcRenderer.invoke("save-video-blob",n)});
//# sourceMappingURL=preload.js.map
