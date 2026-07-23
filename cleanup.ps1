# xin 项目清理脚本
# 删除废弃/重复的项目目录，保留主力版本
# 保留: backend\, mobile\

$targets = @(
    'test-results',
    'tmp_check',
    'TempRN',
    'client',
    'server',
    'WNDDDApp',
    'wnddd'
)

$optional = @{
    'fullstack-app' = '无关的 Todo 任务管理器项目'
}

Write-Host "=== xin 项目清理 ===" -ForegroundColor Cyan
Write-Host "保留: backend\, mobile\"
Write-Host ""
Write-Host "必删目录:" -ForegroundColor Yellow
foreach ($t in $targets) {
    $path = Join-Path 'd:\xin' $t
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeMB = if ($size) { [math]::Round($size / 1MB, 1) } else { 0 }
        Write-Host "  - $t ($sizeMB MB)"
    } else {
        Write-Host "  - $t (不存在，跳过)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "可选删除:" -ForegroundColor Magenta
foreach ($k in $optional.Keys) {
    $path = Join-Path 'd:\xin' $k
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeMB = if ($size) { [math]::Round($size / 1MB, 1) } else { 0 }
        Write-Host "  - $k ($sizeMB MB) -- $($optional[$k])"
    } else {
        Write-Host "  - $k (不存在，跳过)" -ForegroundColor DarkGray
    }
}

Write-Host ""
$delOptional = Read-Host "同时删除可选目录? (输入 yes 一并删除，回车跳过)"
if ($delOptional -eq 'yes') {
    $targets += $optional.Keys
}

Write-Host ""
$confirm = Read-Host "确认删除 $($targets.Count) 个目录? (输入 yes 继续)"
if ($confirm -ne 'yes') {
    Write-Host "已取消" -ForegroundColor Red
    exit
}

foreach ($t in $targets) {
    $path = Join-Path 'd:\xin' $t
    if (Test-Path $path) {
        Write-Host "删除 $t ..." -NoNewline
        Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction Stop
        Write-Host " 完成" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "清理完成! 当前项目结构:" -ForegroundColor Cyan
Get-ChildItem d:\xin -Directory | Where-Object { $_.Name -notmatch '^\.' -and $_.Name -ne 'node_modules' } | ForEach-Object { Write-Host "  - $($_.Name)" }
