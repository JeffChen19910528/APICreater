Dim sh, fso, dir, electronExe, buildFile
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)

electronExe = dir & "\node_modules\electron\dist\electron.exe"
buildFile   = dir & "\build\index.html"

If fso.FileExists(electronExe) And fso.FileExists(buildFile) Then
    ' 直接啟動 Electron，沒有任何 CMD 視窗
    sh.CurrentDirectory = dir
    sh.Run """" & electronExe & """ .", 1, False
Else
    ' 首次執行：顯示 CMD 視窗進行安裝/建置
    sh.Run "cmd /c cd /d """ & dir & """ && node launcher.js", 1, True
End If
