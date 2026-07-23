---
title: '用 RS-HDMR + SALib 做 DEM 参数的全局敏感性分析'
description: '如何用随机采样-高维模型表征（RS-HDMR）量化微观接触参数对宏观流化质量的贡献，并给出一个可直接复用的 Python 分析模板。'
pubDate: '2026-06-28'
tags: ['敏感性分析', 'Python', 'SALib', '研究']
---

要揭示「微观接触参数 → 宏观流动行为」的控制机理，必须量化输入参数波动如何在非线性系统中传播为输出响应的变异。传统的局部导数分析对此力不从心，因此本研究采用**随机采样-高维模型表征（RS-HDMR）**——一种方差分解类的全局敏感性分析技术。

## 为什么是 RS-HDMR

RS-HDMR 将输入-输出响应 $f(\mathbf{x})$ 分解为不同阶数的正交分量之和：

$$y = f(\mathbf{x}) = f_0 + \sum_i f_i(x_i) + \sum_{i<j} f_{ij}(x_i,x_j) + \dots$$

- $f_i(x_i)$：第 $i$ 个参数独立作用的一阶（主）效应；
- $f_{ij}$：两参数耦合的二阶交互效应（DEM 中往往不可忽略）。

各分量用**三次 B 样条**非参数化逼近，避免预设函数形式带来的偏差。对第 $i$ 个参数，一阶敏感性指数即其主效应方差与总输出方差之比：

$$S_i = \frac{V(f_i)}{V(Y)}$$

$S_i$ 越大，说明该微观参数对宏观流动（如动态休止角、内聚指数）的控制越强。

## 数据从哪来：虚拟粉末表征

物理实验中很难独立调控单一接触参数（如摩擦或内聚刚度）。本研究改为对标准转鼓做**高通量 DEM 数值模拟**，构建「微观属性输入 × 宏观测量输出」的高保真数据集（$N > 300$ 案例以保证统计收敛），再交给 RS-HDMR 解耦。实际分析基于 Python 开源库 **SALib** 实现。

## 一个可复用的分析骨架

下面给出一阶敏感性指数计算的核心思路（方差分解），便于在拿到 DEM 输出矩阵后快速验证：

```python
import numpy as np

def first_order_indices(X, Y, nbins=10):
    """示意：用方差分解估计各输入的一阶敏感性指数 Si。

    X: (N, d) 输入矩阵；Y: (N,) 输出向量。
    实际 RS-HDMR 用三次 B 样条拟合 f_i，此处以分箱均值近似主效应。
    """
    Y = np.asarray(Y, float)
    Y_mean = Y.mean()
    V_total = ((Y - Y_mean) ** 2).sum()

    S = []
    for j in range(X.shape[1]):
        x = X[:, j]
        # 按输入分箱，用箱均值近似主效应 f_i
        order = np.argsort(x)
        edges = np.linspace(0, len(x), nbins + 1).astype(int)
        fi = np.empty_like(Y)
        for a, b in zip(edges[:-1], edges[1:]):
            if b <= a:
                continue
            idx = order[a:b]
            fi[idx] = Y[idx].mean()
        V_i = ((fi - Y_mean) ** 2).sum()
        S.append(V_i / V_total)
    return np.array(S)

# 示例：3 个微观参数，模拟输出 = 动态休止角
rng = np.random.default_rng(0)
X = rng.uniform(0, 1, size=(400, 3))
Y = 0.6 * X[:, 0] + 0.3 * X[:, 1] * X[:, 2] + 0.05 * rng.standard_normal(400)
S = first_order_indices(X, Y)
print("S_i =", np.round(S, 3), " # 越接近 1 越主导")
```

> 注意：上例仅为方法示意。正式 RS-HDMR 需用 B 样条拟合各 $f_i$、$f_{ij}$ 并截断至二阶交互项，SALib 提供了对应的采样与分析接口，可直接替换上述 `first_order_indices` 内部实现。

## 结论

RS-HDMR 不仅能识别出影响流化质量的**关键控制参数**，还能揭示「纳米/微观调控如何改变力学平衡、进而重塑宏观流态」的链条——这正是从「调参」走向「机理理解」的关键一步。
