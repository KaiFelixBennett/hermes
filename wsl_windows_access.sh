# === Windows Host Zugriff fuer Hermes Agent ===
export PATH=/mnt/c/Windows/System32/windowspowershell/v1.0:/mnt/c/Windows/System32:/mnt/c/Windows:$PATH
alias ps='powershell.exe'
alias cmd='cmd.exe /c'
alias wsl-choco='choco install -y'
alias wsl-winget='winget install'
# Symlinks fuer einfachen Zugriff auf Windows-Verzeichnisse
ln -sf /mnt/c/Users/KaiFe/Desktop /root/Desktop 2>/dev/null
ln -sf /mnt/c/Users/KaiFe/Documents /root/Documents 2>/dev/null
ln -sf /mnt/c/Users/KaiFe/Downloads /root/Downloads 2>/dev/null
ln -sf /mnt/c/Program\ Files /root/ProgramFiles 2>/dev/null