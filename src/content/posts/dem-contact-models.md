---
title: 'DEM 接触力学模型详解：Hertzian、Mindlin-Deresiewicz 与粘附 / 滚动阻力'
description: '拆解超细粉体 DEM 模拟中四类接触模型的选择逻辑与物理含义：为何放弃线性模型，改用非线性 Hertz-Mindlin 框架。'
pubDate: '2026-07-12'
tags: ['DEM', '力学模型', '研究']
---

在离散元（DEM）模拟中，法向接触力模型的选择直接决定能否精确捕捉颗粒间的动力学行为。Rocky DEM 提供了多种简化线性模型，但对超细、弹性且带黏聚的粉体，**非线性接触力学**才是更真实的选择。

## 1. 法向：Hertzian Spring-Dashpot

与线性弹簧不同，赫兹模型考虑接触区域的几何非线性——法向力与法向重叠量的 $3/2$ 次方成正比：

$$F_n \propto s_n^{3/2}$$

其刚度系数由等效杨氏模量 $E^*$ 与等效接触半径 $R^*$ 共同决定：

$$\hat{K}_H = \frac{4}{3} E^* \sqrt{R^*}$$

阻尼项则通过 Tsuji 等人的修正，建立非线性阻尼系数 $\hat{C}_H$ 与宏观恢复系数 $e$ 的映射，确保碰撞动能损失与实验一致（**热力学一致性**）。

```python
import math

def hertz_stiffness(E1, E2, nu1, nu2, R1, R2):
    """计算 Hertz 接触刚度系数 K_H（示意）。"""
    # 等效杨氏模量
    E_star = 1.0 / ((1 - nu1**2) / E1 + (1 - nu2**2) / E2)
    # 等效接触半径
    R_star = 1.0 / (1.0 / R1 + 1.0 / R2)
    K_H = (4.0 / 3.0) * E_star * math.sqrt(R_star)
    return K_H

# 例：两相同钢质颗粒（示意值，单位 Pa / m）
K = hertz_stiffness(2.0e11, 2.0e11, 0.3, 0.3, 15e-6, 15e-6)
print(f"K_H = {K:.3e} N/m^1.5")
```

## 2. 切向：Mindlin-Deresiewicz

为与法向 Hertzian 响应保持力学一致，切向采用 **Mindlin-Deresiewicz** 模型。它能显式捕捉接触面在宏观滑动发生前的**微观滑移（micro-slip）及其历史依赖性**，比线性库伦模型更贴近高剪切流场中的瞬态动力学。当切向位移 $|s_\tau|$ 超过临界值 $s_{\tau,\max}$（由泊松比 $\nu$ 与法向载荷 $F_n$ 决定）时，切向力平滑退化为经典库伦极限。

## 3. 粘附：Linear Adhesive Force

超细粉体在流化中表现出应力固结，恒定粘附模型不足以描述。线性粘附力模型等效于一个「仅受拉的线性弹簧」，其法向粘附力 $F_{n,adh}$ 随重叠量增加而线性增强，从而复现粉体床层的压实与团聚。两个关键标定参数：

- **粘附距离** $\delta_{adh}$：范德华力生效的临界空间范围；
- **刚度分数** $r_{adh}$：粘附刚度 / 接触加载刚度，量化内聚强度。

## 4. 滚动阻力：Type A Constant Moment

真实工业粉体（如 FCC）常为非球形。为补偿几何简化带来的流动性偏差，引入 **Type A 恒定力矩模型**：施加与法向接触力成正比的反向力矩。参数 $\mu_r$（滚动阻力系数）对应临界斜坡角的正切值 $\tan\theta$，直接关联宏观休止角——这是连接「微观形状效应」与「宏观流动迟滞」的桥梁。

## 小结

| 模型 | 作用 | 关键参数 |
|---|---|---|
| Hertzian Spring-Dashpot | 法向非线性弹性 + 阻尼 | $E^*, R^*, e$ |
| Mindlin-Deresiewicz | 切向微观滑移 | $\mu_s, \epsilon$ |
| Linear Adhesive | 近程黏聚 | $\delta_{adh}, r_{adh}$ |
| Type A Rolling Resistance | 非球形迟滞 | $\mu_r$ |

四类模型协同，为超细颗粒动力学的高通量标定奠定了力学完备的基础。
