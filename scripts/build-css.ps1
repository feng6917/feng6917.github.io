# 本地编译 style.css（供无 Ruby/Jekyll 时预览；GitHub Pages 会自动从 style.scss 生成）
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$lines = Get-Content "style.scss" -Encoding UTF8
if ($lines[0] -eq "---") { $lines = $lines | Select-Object -Skip 2 }
$lines | Set-Content "_jekyll-style.scss" -Encoding UTF8
npx --yes sass "_jekyll-style.scss:style.css" --load-path=_sass --style=expanded
Remove-Item "_jekyll-style.scss" -ErrorAction SilentlyContinue
Write-Host "OK: style.css"
