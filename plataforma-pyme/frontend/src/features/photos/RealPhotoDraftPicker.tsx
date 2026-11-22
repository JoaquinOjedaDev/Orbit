/** Optional photos selected before the business record exists: upload only after POST returns its ID. */
import { useState } from 'react'
import { MAX_UPLOAD_BYTES, PHOTO_TYPES } from './photoGateway.ts'

type Props = {
  files: File[]
  onChange: (files: File[]) => void
  maximum: number
  title: string
  disabled?: boolean
}
export function RealPhotoDraftPicker({ files, onChange, maximum, title, disabled=false }: Props) {
  const [issue, setIssue] = useState('')
  function select(selected: FileList | null) {
    const selection = Array.from(selected ?? [])
    if (!selection.length || disabled) return
    // Galería: sumar selecciones sucesivas; una foto única: reemplazar la anterior.
    const next = maximum===1 ? selection : [...files,...selection]
    if (next.length > maximum) {
      setIssue('The maximum allowed is '+maximum+' '+(maximum===1?'foto.':'fotos.'))
      return
    }
    if (next.some(file => !PHOTO_TYPES.includes(file.type as (typeof PHOTO_TYPES)[number]))) {
      setIssue('Select JPG, PNG or WebP photos.')
      return
    }
    if (next.some(file => !file.size || file.size > MAX_UPLOAD_BYTES)) {
      setIssue('Each photo must weigh up to 5 MB.')
      return
    }
    setIssue('')
    onChange(next)
  }
  return <fieldset className="e3-photo-draft">
    <legend>{title} (opcional)</legend>
    <p>You can choose {maximum===1?'an image':'hasta '+maximum+' imágenes'} Now. First, the tab is saved; then the photos are loaded using their REAL ID. You can also add them later from the tab.</p>
    <label>Select {maximum===1?'fotografía':'fotografías'}
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple={maximum>1}
        disabled={disabled} onChange={event=>{select(event.target.files);event.target.value=''}}/>
    </label>
    <p className="e3-photo-draft-count">{files.length}/{maximum} prepared photos</p>
    {files.length>0&&<ul>{files.map((file,index)=><li key={index}>
      <span>{file.name}</span>
      <button type="button" className="real-auth-secondary" disabled={disabled}
        onClick={()=>{onChange(files.filter((_,i)=>i!==index));setIssue('')}}
        aria-label={'Remove Selection '+file.name}>Remove</button>
    </li>)}</ul>}
    {issue&&<p role="alert" className="real-auth-message real-auth-error">{issue}</p>}
  </fieldset>
}
