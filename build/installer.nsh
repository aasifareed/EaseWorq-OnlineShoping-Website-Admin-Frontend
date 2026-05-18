; Custom NSIS script to close the app before installation.
; We also use patches/app-builder-lib+*.patch so the built-in "cannot be closed"
; dialog is never shown (electron-builder#6865); installer retries then continues.

; Override electron-builder's buggy "app running" check so we don't get
; "AKMART cannot be closed. Please close it manually and click Retry".
; We handle closing ourselves in -Pre below.
!macro customCheckAppRunning
!macroend

; Avoid "Failed to uninstall old application files" (e.g. long paths, file locks).
; Use simple RMDir instead of atomic rename so upgrades succeed more reliably.
!macro customRemoveFiles
  DetailPrint "Removing application files..."
  RMDir /r $INSTDIR
!macroend

; Use Section -Pre which runs before the main installation
Section -Pre
  ; Try to close the running application (don't wait on exit code so failure doesn't block)
  Exec 'cmd /c taskkill /F /IM "AKMART.exe" /T 2>nul'
  ; Give the process time to exit
  Sleep 2000
SectionEnd

