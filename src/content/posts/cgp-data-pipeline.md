---
title: 'Rocky DEM 欧拉力统计的自动化导出与多线程后处理'
description: '分享两个在 Ansys Rocky 中自动导出 Eulerian 统计、并用 Polars 多线程重排 CSV 列的实战脚本，把海量仿真结果变成整齐可用的数据。'
pubDate: '2026-05-15'
tags: ['Python', '数据处理', '自动化', '研究']
---

一次 Rocky DEM 仿真往往产出成百上千个时间步的欧拉力（Eulerian）统计 CSV。手动导出既慢又容易出错。下面分享我实际在用的两段脚本思路：先在 Rocky 内自动导出，再用 **Polars** 多线程把列重排成统一 schema。

## 思路：导出 → 后处理两阶段

第一阶段在 Rocky 的嵌入式 Python 中遍历时间步、写出每个时间步的 CSV；第二阶段用 `ThreadPoolExecutor` 并行处理所有 CSV，把字段对齐到固定的 `DESIRED_COLS` 顺序，缺失列补 `None`，多余列沉到末尾。

## 核心后处理代码（Polars）

```python
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import polars as pl
    POLARS_AVAILABLE = True
except ImportError:
    POLARS_AVAILABLE = False

DESIRED_COLS = [
    "Bin", "Center X", "Center Y", "Center Z",
    "Number of Particles", "Grid Block Volume", "Volume Fraction",
    "Void Fraction", "Max of Coordinate : Y",
    "Local X-Velocity", "Local Z-Velocity", "Local Y-Velocity",
]

def sort_csv(csv_path: Path):
    df = pl.read_csv(csv_path)
    # 创建缺失列
    for col in DESIRED_COLS:
        if col not in df.columns:
            df = df.with_columns(pl.lit(None).alias(col))
    # 多余列排到后面
    extra_cols = [c for c in df.columns if c not in DESIRED_COLS]
    # 重排列顺序
    df = df.select(DESIRED_COLS + extra_cols)
    df.write_csv(csv_path)
    return f"Processed: {csv_path.name}"

def run_post_processing(data_folder_path):
    if not POLARS_AVAILABLE:
        print("[Warning] 'polars' 未安装，已跳过列重排。")
        return
    input_folder = Path(data_folder_path)
    all_csv_files = list(input_folder.rglob("*.csv"))
    MAX_WORKERS = 6
    sort_start = time.time()
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(sort_csv, f) for f in all_csv_files]
        for future in as_completed(futures):
            pass  # 如需单文件进度可打印 future.result()
    print(f"All sorted in {time.time() - sort_start:.2f} sec")
```

## 几个实战要点

- **体积优化**：Rocky 原始导出用 `%.4e`，文件很大。改用 `%g` 格式（数值为 0 时只写 `0`、自动去尾零）可显著压缩体积，且不影响后续分析精度。
- **列顺序统一**：不同案例导出的变量名可能随接触是否开启而增减，后处理脚本用「缺失补 `None` + 多余沉底」的策略保证 schema 一致，方便后续用 Polars / OpenCV 批量读取。
- **多线程**：`MAX_WORKERS = 6` 在机械硬盘上已能明显提速；若 CSV 极多，可适当上调，但注意 I/O 瓶颈。

把这套「导出—重排」流水线化之后，CGP 高通量标定中成百上千个案例的数据整理从「手工噩梦」变成了「一键收尾」。
