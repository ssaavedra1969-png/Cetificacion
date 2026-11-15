# Actualiza los campos (indice/TOC, numero de pagina) de todos los .docx del SGC.
# Requiere Microsoft Word instalado. Cerrar Word antes de ejecutar.
$ErrorActionPreference = "Continue"
$base = "C:\AI\Antigravity\FALPAT srl\Certificacion\SGC"

Write-Host "Actualizando indices de documentos en:" $base
$files = Get-ChildItem -LiteralPath $base -Recurse -Filter *.docx -File |
         Where-Object { $_.Name -notlike "~`$*" }
Write-Host ("Documentos encontrados: {0}" -f $files.Count)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$ok = 0; $fail = 0
foreach ($f in $files) {
    $doc = $null
    try {
        $doc = $word.Documents.Open($f.FullName, $false, $false)
        $doc.Fields.Update() | Out-Null
        foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
        foreach ($sec in $doc.Sections) {
            foreach ($h in $sec.Headers) { $h.Range.Fields.Update() | Out-Null }
            foreach ($ft in $sec.Footers) { $ft.Range.Fields.Update() | Out-Null }
        }
        $doc.Save()
        $doc.Close(0)
        $ok++
        Write-Host ("OK   {0}" -f $f.Name)
    } catch {
        $fail++
        Write-Host ("ERR  {0} : {1}" -f $f.Name, $_.Exception.Message)
        try { if ($doc) { $doc.Close(0) } } catch {}
    }
}

$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host ("Listo.  Actualizados: {0}   Errores: {1}" -f $ok, $fail)
