import { useCallback, useEffect, useState } from 'react'
import React from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']


]

export default function TextEditor() {
    const {id: documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    console.log(documentId)

    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        if (socket == null || quill == null) return

        socket.once("load-document", document => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit('get-document', documentId)
    }, [socket, quill, documentId])

    useEffect(() => {
        if (socket == null || quill == null) return 

        const handler = (delta) => {
            quill.updateContents(delta)
        }
        socket.on('recive-changes', handler)

        return () => {
            socket.off('recive-changes', handler)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return 

        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return
            socket.emit("send-changes", delta)
        }
        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])
    
    const wrapperRef = useCallback((wrapper)=> {
        if(wrapper == null) return

        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const q = new Quill(editor, {theme : "snow", modules: {toolbar: TOOLBAR_OPTIONS}})
        q.disable()
        q.setText("Loading...")
        setQuill(q)
    }, [])
    
    return ( 
        <div className="container" ref={wrapperRef}>
        </div>
    )
}
